#include "RecommendController.h"
#include "../../include/json.hpp"
#include "../services/DatabaseService.h"
#include "../middleware/AuthMiddleware.h"

using json = nlohmann::json;

void RecommendController::registerRoutes(httplib::Server& svr) {
    svr.Get("/api/recommend/services", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser;
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        
        auto& db = DatabaseService::getInstance();
        int limit = req.has_param("limit") ? std::stoi(req.get_param_value("limit")) : 10;
        
        auto services = db.getRecommendedServices(authUser.userId, limit);
        
        json result = json::array();
        for (const auto& s : services) {
            auto provider = db.getProviderById(s.provider_id);
            auto coupons = db.getAvailableCoupons(s.provider_id);
            
            json couponArray = json::array();
            for (const auto& c : coupons) {
                couponArray.push_back({
                    {"id", c.id},
                    {"name", c.name},
                    {"coupon_type", c.coupon_type},
                    {"discount_amount", c.discount_amount},
                    {"discount_percent", c.discount_percent},
                    {"min_amount", c.min_amount}
                });
            }
            
            result.push_back({
                {"id", s.id},
                {"provider_id", s.provider_id},
                {"provider_name", provider.name},
                {"name", s.name},
                {"description", s.description},
                {"category", s.category},
                {"price", s.price},
                {"duration", s.duration},
                {"image", s.image},
                {"rating", db.getAverageRating(s.id)},
                {"coupons", couponArray}
            });
        }
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/recommend/hot", [](const httplib::Request& req, httplib::Response& res) {
        auto& db = DatabaseService::getInstance();
        int limit = req.has_param("limit") ? std::stoi(req.get_param_value("limit")) : 10;
        
        auto services = db.getRecommendedServices(0, limit);
        
        json result = json::array();
        for (const auto& s : services) {
            auto provider = db.getProviderById(s.provider_id);
            result.push_back({
                {"id", s.id},
                {"provider_id", s.provider_id},
                {"provider_name", provider.name},
                {"name", s.name},
                {"description", s.description},
                {"category", s.category},
                {"price", s.price},
                {"duration", s.duration},
                {"image", s.image},
                {"rating", db.getAverageRating(s.id)}
            });
        }
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/recommend/category/:category", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser;
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        
        auto category = req.get_param_value("category");
        auto& db = DatabaseService::getInstance();
        
        auto services = db.searchServices("", category);
        
        std::sort(services.begin(), services.end(), [&](const models::Service& a, const models::Service& b) {
            double ratingA = db.getAverageRating(a.id);
            double ratingB = db.getAverageRating(b.id);
            return ratingA > ratingB;
        });
        
        json result = json::array();
        for (size_t i = 0; i < std::min(services.size(), (size_t)10); ++i) {
            const auto& s = services[i];
            auto provider = db.getProviderById(s.provider_id);
            result.push_back({
                {"id", s.id},
                {"provider_id", s.provider_id},
                {"provider_name", provider.name},
                {"name", s.name},
                {"description", s.description},
                {"category", s.category},
                {"price", s.price},
                {"duration", s.duration},
                {"image", s.image},
                {"rating", db.getAverageRating(s.id)}
            });
        }
        res.set_content(result.dump(), "application/json");
    });
}