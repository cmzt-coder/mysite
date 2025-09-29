# Spring Boot 最佳实践

## 简介

Spring Boot 是基于 Spring 框架的快速开发脚手架，它简化了 Spring 应用的配置和部署。本文总结了 Spring Boot 开发中的最佳实践，帮助开发者构建高质量、可维护的应用程序。

## 目录

- [项目结构](#项目结构)
- [配置管理](#配置管理)
- [数据访问层](#数据访问层)
- [服务层设计](#服务层设计)
- [控制器层](#控制器层)
- [异常处理](#异常处理)
- [安全配置](#安全配置)
- [测试策略](#测试策略)
- [性能优化](#性能优化)
- [监控和日志](#监控和日志)
- [部署和运维](#部署和运维)

## 项目结构

### 推荐的包结构

```
com.example.myapp
├── MyAppApplication.java          // 主启动类
├── config/                        // 配置类
│   ├── DatabaseConfig.java
│   ├── SecurityConfig.java
│   └── WebConfig.java
├── controller/                    // 控制器层
│   ├── UserController.java
│   └── ProductController.java
├── service/                       // 服务层
│   ├── UserService.java
│   ├── UserServiceImpl.java
│   └── ProductService.java
├── repository/                    // 数据访问层
│   ├── UserRepository.java
│   └── ProductRepository.java
├── model/                         // 实体类
│   ├── entity/
│   │   ├── User.java
│   │   └── Product.java
│   └── dto/
│       ├── UserDto.java
│       └── ProductDto.java
├── exception/                     // 异常处理
│   ├── GlobalExceptionHandler.java
│   └── CustomException.java
└── util/                          // 工具类
    ├── DateUtil.java
    └── StringUtil.java
```

### 主启动类最佳实践

```java
@SpringBootApplication
@EnableJpaRepositories("com.example.myapp.repository")
@EntityScan("com.example.myapp.model.entity")
public class MyAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyAppApplication.class, args);
    }
}
```

## 配置管理

### 使用 Profile 管理不同环境

```yaml
# application.yml
spring:
  profiles:
    active: dev

---
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp_dev
    username: dev_user
    password: dev_password
  jpa:
    show-sql: true

---
# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://prod-server:3306/myapp_prod
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    show-sql: false
```

### 配置属性类

```java
@ConfigurationProperties(prefix = "app")
@Component
@Data
public class AppProperties {
    private String name;
    private String version;
    private Security security = new Security();
    
    @Data
    public static class Security {
        private String jwtSecret;
        private int jwtExpirationMs;
    }
}
```

## 数据访问层

### Repository 最佳实践

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 使用方法名查询
    Optional<User> findByEmail(String email);
    
    List<User> findByStatusAndCreatedDateAfter(UserStatus status, LocalDateTime date);
    
    // 使用 @Query 注解
    @Query("SELECT u FROM User u WHERE u.department.name = :deptName")
    List<User> findByDepartmentName(@Param("deptName") String departmentName);
    
    // 原生 SQL 查询
    @Query(value = "SELECT * FROM users WHERE created_date > :date", nativeQuery = true)
    List<User> findUsersCreatedAfter(@Param("date") LocalDateTime date);
    
    // 分页查询
    Page<User> findByStatus(UserStatus status, Pageable pageable);
}
```

### 实体类设计

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    private UserStatus status;
    
    @CreationTimestamp
    private LocalDateTime createdDate;
    
    @UpdateTimestamp
    private LocalDateTime updatedDate;
    
    @Version
    private Long version; // 乐观锁
}
```

## 服务层设计

### 服务接口和实现

```java
public interface UserService {
    UserDto createUser(CreateUserRequest request);
    UserDto getUserById(Long id);
    UserDto updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
    Page<UserDto> getUsers(Pageable pageable);
}

@Service
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    
    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }
    
    @Override
    public UserDto createUser(CreateUserRequest request) {
        // 验证邮箱唯一性
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists: " + request.getEmail());
        }
        
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .status(UserStatus.ACTIVE)
            .build();
            
        User savedUser = userRepository.save(user);
        log.info("Created user with id: {}", savedUser.getId());
        
        return userMapper.toDto(savedUser);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return userMapper.toDto(user);
    }
}
```

## 控制器层

### RESTful API 设计

```java
@RestController
@RequestMapping("/api/v1/users")
@Validated
@Slf4j
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserDto user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(user, "User created successfully"));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(
            @PathVariable @Min(1) Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
            @PageableDefault(size = 20, sort = "createdDate", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        Page<UserDto> users = userService.getUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
```

### 统一响应格式

```java
@Data
@Builder
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Success");
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
```

## 异常处理

### 全局异常处理器

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UserNotFoundException ex) {
        log.warn("User not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("Validation failed").toBuilder()
                .data(errors)
                .build());
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Internal server error"));
    }
}
```

## 安全配置

### Spring Security 配置

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

## 测试策略

### 单元测试

```java
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private UserMapper userMapper;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    @Test
    void createUser_ShouldReturnUserDto_WhenValidRequest() {
        // Given
        CreateUserRequest request = new CreateUserRequest("test@example.com", "password");
        User user = User.builder().id(1L).email("test@example.com").build();
        UserDto userDto = new UserDto(1L, "test@example.com");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(userDto);
        
        // When
        UserDto result = userService.createUser(request);
        
        // Then
        assertThat(result).isEqualTo(userDto);
        verify(userRepository).save(any(User.class));
    }
}
```

### 集成测试

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void createUser_ShouldReturn201_WhenValidRequest() {
        // Given
        CreateUserRequest request = new CreateUserRequest("test@example.com", "password");
        
        // When
        ResponseEntity<ApiResponse> response = restTemplate.postForEntity(
            "/api/v1/users", request, ApiResponse.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(userRepository.findByEmail("test@example.com")).isPresent();
    }
}
```

## 性能优化

### 缓存配置

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        RedisCacheManager.Builder builder = RedisCacheManager
            .RedisCacheManagerBuilder
            .fromConnectionFactory(redisConnectionFactory())
            .cacheDefaults(cacheConfiguration());
        
        return builder.build();
    }
    
    private RedisCacheConfiguration cacheConfiguration() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));
    }
}

// 在服务中使用缓存
@Service
public class UserServiceImpl implements UserService {
    
    @Cacheable(value = "users", key = "#id")
    public UserDto getUserById(Long id) {
        // 实现逻辑
    }
    
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        // 实现逻辑
    }
}
```

## 监控和日志

### Actuator 配置

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
```

### 日志配置

```yaml
logging:
  level:
    com.example.myapp: DEBUG
    org.springframework.security: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/myapp.log
```

## 部署和运维

### Docker 配置

```dockerfile
FROM openjdk:17-jre-slim

VOLUME /tmp

COPY target/myapp-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]
```

### 健康检查

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    private final DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(1)) {
                return Health.up()
                    .withDetail("database", "Available")
                    .build();
            }
        } catch (Exception ex) {
            return Health.down(ex)
                .withDetail("database", "Unavailable")
                .build();
        }
        return Health.down()
            .withDetail("database", "Unavailable")
            .build();
    }
}
```

---

*最后更新时间：2024年*