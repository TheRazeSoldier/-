#include "ProviderController.h"
#include "../../include/json.hpp"
#include "../services/DatabaseService.h"
#include "../middleware/AuthMiddleware.h"

using json = nlohmann::json;

void ProviderController::registerRoutes(httplib::Server& svr) {
    svr.Get("/api/providers", [](const httplib::Request& req, httplib::Response& res) {
        auto& db = DatabaseService::getInstance();
        auto category = req.get_param_value("category");
        
        std::vector<models::Provider> providers;
        if (!category.empty()) {
            providers = db.getProvidersByCategory(category);
        } else {
            providers = db.getAllProviders();
        }
        
        json result = json::array();
        for (const auto& p : providers) {
            result.push_back({
                {"id", p.id},
                {"user_id", p.user_id},
                {"name", p.name},
                {"description", p.description},
                {"address", p.address},
                {"phone", p.phone},
                {"category", p.category},
                {"avatar", p.avatar},
                {"status", p.status},
                {"audit_status", p.audit_status}
            });
        }
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/providers/:id", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.get_param_value("id"));
        auto& db = DatabaseService::getInstance();
        auto provider = db.getProviderById(id);
        
        if (provider.id > 0) {
            res.set_content(json{
                {"id", provider.id},
                {"user_id", provider.user_id},
                {"name", provider.name},
                {"description", provider.description},
                {"address", provider.address},
                {"phone", provider.phone},
                {"category", provider.category},
                {"avatar", provider.avatar},
                {"status", provider.status},
                {"audit_status", provider.audit_status},
                {"audit_comment", provider.audit_comment},
                {"license_number", provider.license_number},
                {"license_image", provider.license_image},
                {"created_at", provider.created_at}
            }.dump(), "application/json");
        } else {
            res.status = 404;
            res.set_content(json{{"error", "服务商不存在"}}.dump(), "application/json");
        }
    });

    svr.Post("/api/providers", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser;
        if (!AuthMiddleware::requireRole(req, res, authUser, "provider")) return;
        
        auto body = json::parse(req.body);
        auto& db = DatabaseService::getInstance();
        
        models::Provider provider{};
        provider.user_id = authUser.userId;
        provider.name = body["name"];
        provider.description = body.contains("description") ? body["description"] : "";
        provider.address = body.contains("address") ? body["address"] : "";
        provider.phone = body.contains("phone") ? body["phone"] : "";
        provider.category = body.contains("category") ? body["category"] : "";
        provider.avatar = body.contains("avatar") ? body["avatar"] : "";
        provider.license_number = body.contains("license_number") ? body["license_number"] : "";
        provider.license_image = body.contains("license_image") ? body["license_image"] : "";
        provider.audit_status = "pending";
        
        int providerId = db.createProvider(provider);
        if (providerId > 0) {
            res.set_content(json{{"message", "创建成功，等待审核"}, {"id", providerId}}.dump(), "application/json");
        } else {
            res.status = 500;
            res.set_content(json{{"error", "创建失败"}}.dump(), "application/json");
        }
    });

    svr.Put("/api/providers/:id", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser;
        if (!AuthMiddleware::requireRole(req, res, authUser, "provider")) return;
        
        int id = std::stoi(req.get_param_value("id"));
        auto body = json::parse(req.body);
        auto& db = DatabaseService::getInstance();
        
        models::Provider provider{};
        provider.name = body["name"];
        provider.description = body.contains("description") ? body["description"] : "";
        provider.address = body.contains("address") ? body["address"] : "";
        provider.phone = body.contains("phone") ? body["phone"] : "";
        provider.category = body.contains("category") ? body["category"] : "";
        provider.avatar = body.contains("avatar") ? body["avatar"] : "";
        provider.license_number = body.contains("license_number") ? body["license_number"] : "";
        provider.license_image = body.contains("license_image") ? body["license_image"] : "";
        
        if (db.updateProvider(id, provider)) {
            res.set_content(json{{"message", "更新成功"}}.dump(), "application/json");
        } else {
            res.status = 500;
            res.set_content(json{{"error", "更新失败"}}.dump(), "application/json");
        }
    });

    svr.Get("/api/providers/audit/pending", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser;
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        
        auto& db = DatabaseService::getInstance();
        auto providers = db.getProvidersByAuditStatus("pending");
        
        json result = json::array();
        for (const auto& p : providers) {
            result.push_back({
                {"id", p.id},
                {"user_id", p.user_id},
                {"name", p.name},
                {"description", p.description},
                {"address", p.address},
                {"phone", p.phone},
                {"category", p.category},
                {"license_number", p.license_number},
                {"license_image", p.license_image},
                {"audit_status", p.audit_status},
                {"created_at", p.created_at}
            });
        }
        res.set_content(result.dump(), "application/json");
    });

    svr.Post("/api/providers/:id/audit", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser;
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        
        int id = std::stoi(req.get_param_value("id"));
        auto body = json::parse(req.body);
        std::string auditStatus = body["audit_status"];
        std::string auditComment = body.contains("audit_comment") ? body["audit_comment"] : "";
        
        auto& db = DatabaseService::getInstance();
        auto provider = db.getProviderById(id);
        
        if (provider.id == 0) {
            res.status = 404;
            res.set_content(json{{"error", "服务商不存在"}}.dump(), "application/json");
            return;
        }
        
        if (db.auditProvider(id, auditStatus, auditComment)) {
            res.set_content(json{{"message", "审核完成"}}.dump(), "application/json");
        } else {
            res.status = 500;
            res.set_content(json{{"error", "审核失败"}}.dump(), "application/json");
        }
    });
}