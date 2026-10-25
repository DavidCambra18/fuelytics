package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;
import jakarta.persistence.EntityManagerFactory;
import jakarta.validation.Validation;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.context.annotation.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.*;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.*;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.*;
import com.fuelytics.backend.repository.*;
import com.fuelytics.backend.security.*;

// Opt-in only. This test cannot read DB_URL or connect to Neon/production.
// Creates its own random schema in a disposable, loopback-only fuelytics_test database.
@EnabledIfEnvironmentVariable(named="FUELYTICS_TEST_DB_URL", matches="jdbc:postgresql://(?:127[.]0[.]0[.]1|localhost):[0-9]+/fuelytics_test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PostgresIntegrationTest {
    private String schema, url, username, password;
    private AnnotationConfigApplicationContext context;
    private TransactionTemplate tx;
    private final AtomicInteger names = new AtomicInteger();

    @BeforeAll void start() throws Exception {
        url = System.getenv("FUELYTICS_TEST_DB_URL");
        username = System.getenv("FUELYTICS_TEST_DB_USER"); password = System.getenv("FUELYTICS_TEST_DB_PASSWORD");
        schema = "fuelytics_it_" + UUID.randomUUID().toString().replace("-", "");
        try (var connection = DriverManager.getConnection(url, username, password); var sql = connection.createStatement()) {
            sql.execute("CREATE SCHEMA " + schema);
            sql.execute("SET search_path TO " + schema);
            ScriptUtils.executeSqlScript(connection, new FileSystemResource(Path.of("..", "database", "schema.sql")));
        }
        context = new AnnotationConfigApplicationContext();
        var dataSource = new DriverManagerDataSource(url + "?currentSchema=" + schema, username, password);
        context.registerBean(DataSource.class, () -> dataSource);
        context.register(JpaConfiguration.class);
        context.registerBean(ConsumptionCalculator.class);
        context.registerBean(BadgeService.class, () -> mock(BadgeService.class));
        context.registerBean(BCryptPasswordEncoder.class, () -> new BCryptPasswordEncoder(4));
        context.registerBean(JwtService.class, () -> {
            var jwt = mock(JwtService.class); when(jwt.generateToken(anyString(), anyInt())).thenReturn("isolated-test-token"); return jwt;
        });
        context.registerBean(ApplicationEventPublisher.class, () -> mock(ApplicationEventPublisher.class));
        context.registerBean(jakarta.validation.Validator.class, () -> Validation.buildDefaultValidatorFactory().getValidator());
        context.registerBean(UserService.class); context.registerBean(VehicleService.class);
        context.registerBean(FuelingService.class); context.registerBean(ExpenseService.class);
        context.registerBean(MaintenanceReminderService.class); context.registerBean(HistoryService.class);
        context.registerBean(GoogleAccountService.class); context.registerBean(ExportService.class);
        context.refresh();
        tx = new TransactionTemplate(context.getBean(PlatformTransactionManager.class));
    }
    @AfterAll void stop() throws Exception {
        if (context != null) context.close();
        if (schema != null) try (var connection = DriverManager.getConnection(url, username, password); var sql = connection.createStatement()) {
            // The schema name is generated above; no application schema is ever dropped.
            sql.execute("DROP SCHEMA " + schema + " CASCADE");
        }
    }
    @Configuration @EnableTransactionManagement
    @EnableJpaRepositories(basePackageClasses=UserRepository.class)
    static class JpaConfiguration {
        @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            var factory = new LocalContainerEntityManagerFactoryBean(); factory.setDataSource(dataSource);
            factory.setPackagesToScan("com.fuelytics.backend.entity"); factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "none",
                    "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl"));
            return factory;
        }
        @Bean PlatformTransactionManager transactionManager(EntityManagerFactory factory) { return new JpaTransactionManager(factory); }
    }
    private <T> T bean(Class<T> type) { return context.getBean(type); }
    private User owner() {
        var dto = new UserRegisterDTO(); String name = "review" + names.incrementAndGet();
        dto.setUsername(name); dto.setEmail(name + "@example.com"); dto.setPassword("ExamplePass1");
        bean(UserService.class).register(dto);
        return bean(UserRepository.class).findByEmail(dto.getEmail());
    }
    private Vehicle vehicle(User user) {
        return tx.execute(status -> {
            var vehicle = new Vehicle(); vehicle.setUser(user); vehicle.setBrand("Prueba"); vehicle.setModel("Aislado");
            vehicle.setVehicleType(VehicleType.car); vehicle.setVehicleEnergyType(VehicleEnergyType.diesel);
            vehicle.setGearbox(GearboxType.manual); vehicle.setTankCapacity(new BigDecimal("50")); vehicle.setYear(2020); vehicle.setOdometer(1000);
            return bean(VehicleRepository.class).saveAndFlush(vehicle);
        });
    }
    private FuelEntry entry(Vehicle vehicle, int id, RefuelingType type, String distance, String quantity) {
        var entry = ReleaseCorrectionsTest.entry(id,"2026-01-01",type,distance,quantity,"40");
        entry.setId(null); entry.setPricePerLiter(new BigDecimal("1.5")); entry.setDrivingType(DrivingType.normal); entry.setTireType(TireType.summer); entry.setVehicle(vehicle); entry.setOdometer(1000 + id * 100); return entry;
    }
    @Test void registrationLoginGoogleAndPrivateProfilesPersistCorrectly() {
        User user = owner();
        var login = new UserLoginDTO(); login.setEmail(user.getEmail()); login.setPassword("ExamplePass1");
        assertEquals("isolated-test-token", bean(UserService.class).login(login).get("token"));
        assertNotEquals("ExamplePass1", user.getPassword());
        var privacy = new UserPrivacyDTO(); privacy.setProfilePublic(false); bean(UserService.class).updatePrivacy(user.getEmail(), privacy);
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> bean(UserService.class).getPublicProfile(user.getUsername(), "visitor@example.com")).getStatusCode().value());
        var google = new GoogleIdentity("subject-" + user.getId(), "google" + user.getId() + "@example.com", "Nombre", "Apellido");
        var session = bean(GoogleAccountService.class).register(google, "google" + user.getId());
        assertEquals("isolated-test-token", session.get("token"));
        assertTrue(bean(GoogleAccountService.class).login(google).isPresent());
        assertNull(bean(UserRepository.class).findByEmail(google.email()).getPassword());
    }
    @Test void historyPagesKeepFullSummariesAndConsumptionAcrossPageBoundaries() {
        User user = owner(); Vehicle vehicle = vehicle(user);
        tx.executeWithoutResult(status -> {
            var repository = bean(FuelingRepository.class);
            repository.save(entry(vehicle,1,RefuelingType.initial,"0","40"));
            repository.save(entry(vehicle,2,RefuelingType.partial,"200","20"));
            repository.save(entry(vehicle,3,RefuelingType.complete,"300","25"));
            for (int i=4;i<=35;i++) repository.save(entry(vehicle,i,RefuelingType.complete,"500","30"));
            for (int i=0;i<31;i++) { var expense=new Expense(); expense.setVehicle(vehicle); expense.setDate(LocalDate.of(2026,1,1)); expense.setType(ExpenseType.insurance); expense.setCost(new BigDecimal("10")); bean(ExpenseRepository.class).save(expense); }
        });
        var history = bean(HistoryService.class);
        var first=history.fuelings(vehicle.getId(),user.getEmail(),1,15);
        var second=history.fuelings(vehicle.getId(),user.getEmail(),2,15);
        assertEquals(4500, bean(VehicleService.class).getVehicles(user.getEmail()).stream().filter(item -> item.getId().equals(vehicle.getId())).findFirst().orElseThrow().getOdometer());
        assertEquals(35,first.totalElements()); assertEquals(15,first.content().size()); assertEquals(3,first.totalPages());
        var ids=new HashSet<Integer>(); first.content().forEach(row -> ids.add(row.fueling().getId()));
        second.content().forEach(row -> assertTrue(ids.add(row.fueling().getId())));
        var last=history.fuelings(vehicle.getId(),user.getEmail(),999,15);
        assertEquals(3,last.page()); assertEquals(5,last.content().size());
        var complete=last.content().stream().filter(row -> row.fueling().getRefueling()==RefuelingType.complete).reduce((a,b) -> b).orElseThrow();
        assertEquals(0,new BigDecimal("9").compareTo(complete.displayConsumption()));
        var expenses=history.expenses(vehicle.getId(),user.getEmail(),2,15,2026);
        assertEquals(31,expenses.totalElements()); assertEquals(0,new BigDecimal("310").compareTo(expenses.summary().get("totalCost")));
        assertEquals(0,new BigDecimal("310").compareTo(expenses.summary().get("yearlyCost")));
        assertEquals(400,assertThrows(ResponseStatusException.class,()->history.fuelings(vehicle.getId(),user.getEmail(),0,15)).getStatusCode().value());
        assertEquals(400,assertThrows(ResponseStatusException.class,()->history.expenses(vehicle.getId(),user.getEmail(),1,101,2026)).getStatusCode().value());
        assertEquals(403,assertThrows(ResponseStatusException.class,()->history.fuelings(vehicle.getId(),"visitor@example.com",1,15)).getStatusCode().value());
        assertEquals(403,assertThrows(ResponseStatusException.class,()->history.expenses(vehicle.getId(),"visitor@example.com",1,15,2026)).getStatusCode().value());
    }
    @Test void confirmedFuelingCreateEditDeleteUpdatesTheVehicleOdometerSnapshot() {
        User user=owner();Vehicle vehicle=vehicle(user);var service=bean(FuelingService.class);
        var dto=new FuelingDTO();dto.setVehicleId(vehicle.getId());dto.setDate(LocalDate.of(2026,1,1));
        dto.setOdometer(2000);dto.setRefueling(RefuelingType.initial);dto.setFuelType(FuelType.diesel);
        dto.setDistance(BigDecimal.ZERO);dto.setLiters(new BigDecimal("30"));dto.setPriceTotal(new BigDecimal("45"));
        dto.setDrivingType(DrivingType.normal);dto.setTireType(TireType.summer);
        var entry=service.createFueling(dto,user.getEmail());
        assertEquals(2000,bean(VehicleService.class).getVehicleById(vehicle.getId(),user.getEmail()).getOdometer());
        dto.setOdometer(2500);service.updateFueling(entry.getId(),dto,user.getEmail());
        assertEquals(2500,bean(VehicleService.class).getVehicleById(vehicle.getId(),user.getEmail()).getOdometer());
        service.deleteFueling(entry.getId(),user.getEmail());
        assertEquals(1000,bean(VehicleService.class).getVehicleById(vehicle.getId(),user.getEmail()).getOdometer());
    }
    @Test void emptyHistoryKeepsValidPaginationAndZeroSummary() {
        User user=owner(); Vehicle vehicle=vehicle(user);var history=bean(HistoryService.class);
        var fuelings=history.fuelings(vehicle.getId(),user.getEmail(),1,15);
        assertEquals(1,fuelings.page());assertEquals(1,fuelings.totalPages());assertTrue(fuelings.content().isEmpty());assertNull(fuelings.startDate());
        var expenses=history.expenses(vehicle.getId(),user.getEmail(),1,15,2026);
        assertEquals(0,expenses.totalElements());assertEquals(BigDecimal.ZERO,expenses.summary().get("totalCost"));
        assertEquals(BigDecimal.ZERO,expenses.summary().get("yearlyCost"));assertNull(expenses.endDate());
        assertEquals(400,assertThrows(ResponseStatusException.class,()->history.fuelings(vehicle.getId(),user.getEmail(),Integer.MAX_VALUE,100)).getStatusCode().value());
    }
    @Test void maintenanceLinkUnlinkAndExpenseDeletionPreserveIndependentReminder() {
        User user=owner(); Vehicle vehicle=vehicle(user); var reminders=bean(MaintenanceReminderService.class);
        var reminder=reminders.save(vehicle.getId(),null,new MaintenanceReminderDTO("Aceite",null,1200,null),user.getEmail());
        var expense=new ExpenseDTO(); expense.setVehicleId(vehicle.getId()); expense.setDate(LocalDate.of(2026,1,2));
        expense.setType(ExpenseType.maintenance); expense.setDescription("Cambio de aceite"); expense.setCost(new BigDecimal("80")); expense.setMaintenanceReminderId(reminder.id());
        var saved=bean(ExpenseService.class).createExpense(expense,user.getEmail());
        assertEquals("COMPLETED",reminders.list(vehicle.getId(),user.getEmail()).get(0).status());
        assertEquals(saved.getId(),reminders.list(vehicle.getId(),user.getEmail()).get(0).expenseId());
        var page=bean(HistoryService.class).expenses(vehicle.getId(),user.getEmail(),1,15,2026);
        assertEquals(reminder.id(),page.content().get(0).getMaintenanceReminderId());
        assertEquals("PENDING",reminders.complete(vehicle.getId(),reminder.id(),null,user.getEmail()).status());
        reminders.complete(vehicle.getId(),reminder.id(),saved.getId(),user.getEmail());
        bean(ExpenseService.class).deleteExpense(saved.getId(),user.getEmail());
        assertEquals("PENDING",reminders.list(vehicle.getId(),user.getEmail()).get(0).status());
        assertEquals(403,assertThrows(ResponseStatusException.class,()->reminders.list(vehicle.getId(),"visitor@example.com")).getStatusCode().value());
    }
    @Test void simultaneousProfileAndPrivacyUpdatesDoNotOverwriteEachOther() throws Exception {
        User user=owner(); var locked=new CountDownLatch(1); var release=new CountDownLatch(1);
        var executor=Executors.newFixedThreadPool(2);
        try {
            var profile=executor.submit(()->tx.executeWithoutResult(status->{
                var row=bean(UserRepository.class).findByEmailForUpdate(user.getEmail()); row.setFirstName("Nuevo");
                locked.countDown(); await(release); bean(UserRepository.class).saveAndFlush(row);
            }));
            assertTrue(locked.await(5,TimeUnit.SECONDS));
            var privacy=executor.submit(()->{var dto=new UserPrivacyDTO();dto.setProfilePublic(false);return bean(UserService.class).updatePrivacy(user.getEmail(),dto);});
            assertThrows(TimeoutException.class,()->privacy.get(150,TimeUnit.MILLISECONDS));
            release.countDown(); profile.get(10,TimeUnit.SECONDS); privacy.get(10,TimeUnit.SECONDS);
            User saved=bean(UserRepository.class).findByEmail(user.getEmail()); assertEquals("Nuevo",saved.getFirstName()); assertFalse(saved.getProfilePublic());
        } finally {release.countDown(); executor.shutdownNow();}
    }
    @Test void concurrentFirstFuelingAndVehicleEditCannotChangeEnergyUnderHistory() throws Exception {
        User user=owner();Vehicle vehicle=vehicle(user);var locked=new CountDownLatch(1);var release=new CountDownLatch(1);
        var executor=Executors.newFixedThreadPool(2);
        try {
            var fueling=executor.submit(()->tx.executeWithoutResult(status->{
                bean(UserRepository.class).findByEmailForUpdate(user.getEmail());bean(VehicleRepository.class).findByIdForUpdate(vehicle.getId());
                bean(FuelingRepository.class).saveAndFlush(entry(vehicle,1,RefuelingType.initial,"0","40"));locked.countDown();await(release);
            }));
            assertTrue(locked.await(5,TimeUnit.SECONDS));
            var edit=executor.submit(()->{var dto=new VehicleUpdateDTO();dto.setVehicleEnergyType(VehicleEnergyType.electric);
                return assertThrows(ResponseStatusException.class,()->bean(VehicleService.class).updateVehicle(vehicle.getId(),dto,user.getEmail()));});
            assertThrows(TimeoutException.class,()->edit.get(150,TimeUnit.MILLISECONDS));release.countDown();fueling.get(10,TimeUnit.SECONDS);
            assertEquals(409,edit.get(10,TimeUnit.SECONDS).getStatusCode().value());
            assertEquals(VehicleEnergyType.diesel,bean(VehicleRepository.class).findById(vehicle.getId()).orElseThrow().getVehicleEnergyType());
        } finally {release.countDown();executor.shutdownNow();}
    }
    private static void await(CountDownLatch latch) {try {if(!latch.await(8,TimeUnit.SECONDS)) throw new IllegalStateException("Timed out waiting for isolated test");}catch(InterruptedException failure){Thread.currentThread().interrupt();throw new IllegalStateException(failure);}}
}
