#pragma once
#include "../models/models.h"
#include <sqlite3.h>
#include <mutex>

class DatabaseService {
public:
    static DatabaseService& getInstance();
    bool init(const std::string& dbPath);
    void close();

    // Users
    int createUser(const models::User& user);
    models::User getUserById(int id);
    models::User getUserByUsername(const std::string& username);
    models::User getUserByEmail(const std::string& email);
    bool updateUser(int id, const models::User& user);
    std::vector<models::User> getAllUsers();

    // Providers
    int createProvider(const models::Provider& provider);
    models::Provider getProviderById(int id);
    models::Provider getProviderByUserId(int userId);
    std::vector<models::Provider> getAllProviders();
    std::vector<models::Provider> getProvidersByCategory(const std::string& category);
    std::vector<models::Provider> getProvidersByAuditStatus(const std::string& auditStatus);
    bool updateProvider(int id, const models::Provider& provider);
    bool auditProvider(int id, const std::string& auditStatus, const std::string& auditComment);

    // Services
    int createService(const models::Service& service);
    models::Service getServiceById(int id);
    std::vector<models::Service> getServicesByProvider(int providerId);
    std::vector<models::Service> getAllServices();
    std::vector<models::Service> searchServices(const std::string& keyword, const std::string& category);
    std::vector<models::Service> advancedSearchServices(const std::string& keyword, const std::string& category, double minPrice, double maxPrice, int minDuration, int maxDuration, const std::string& sortBy, const std::string& sortOrder);
    std::vector<models::Service> getRecommendedServices(int userId, int limit);
    std::vector<std::string> getAllCategories();
    bool updateService(int id, const models::Service& service);
    bool deleteService(int id);

    // Appointments
    int createAppointment(const models::Appointment& appt);
    models::Appointment getAppointmentById(int id);
    std::vector<models::Appointment> getAppointmentsByUser(int userId);
    std::vector<models::Appointment> getAppointmentsByProvider(int providerId);
    bool updateAppointmentStatus(int id, const std::string& status);
    bool cancelAppointment(int id);
    std::vector<models::Appointment> getAppointmentsByDate(int providerId, const std::string& date);

    // Reviews
    int createReview(const models::Review& review);
    std::vector<models::Review> getReviewsByService(int serviceId);
    std::vector<models::Review> getReviewsByProvider(int providerId);
    double getAverageRating(int serviceId);
    bool deleteReview(int id);

    // Notifications
    int createNotification(const models::Notification& notif);
    std::vector<models::Notification> getNotificationsByUser(int userId);
    bool markNotificationRead(int id);
    int getUnreadNotificationCount(int userId);

    // Coupons
    int createCoupon(const models::Coupon& coupon);
    models::Coupon getCouponById(int id);
    std::vector<models::Coupon> getCouponsByProvider(int providerId);
    std::vector<models::Coupon> getAvailableCoupons(int providerId);
    int claimCoupon(int userId, int couponId);
    std::vector<models::UserCoupon> getUserCoupons(int userId);
    bool useCoupon(int userCouponId);
    bool updateCoupon(int id, const models::Coupon& coupon);
    bool deleteCoupon(int id);

    // Stats
    models::Stats getStats();

private:
    DatabaseService() = default;
    ~DatabaseService();
    DatabaseService(const DatabaseService&) = delete;
    DatabaseService& operator=(const DatabaseService&) = delete;

    bool createTables();
    bool executeSQL(const std::string& sql);
    sqlite3* db_ = nullptr;
    std::mutex mutex_;
};