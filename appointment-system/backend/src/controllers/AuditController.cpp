#include "AuditController.h"
#include "../services/DatabaseService.h"
#include "../middleware/AuthMiddleware.h"
#include "../auth.h"
#include "../../include/json.hpp"

using json = nlohmann::json;

void AuditController::registerRoutes(httplib::Server& svr) {
    svr.Get("/api/audit/providers", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        auto& db = DatabaseService::getInstance();
        auto providers = db.getAllProviders();
        
        json result = json::array();
        for (auto& p : providers) {
            auto user = db.getUserById(p.user_id);
            result.push_back({
                {"id", p.id},
                {"name", p.name},
                {"description", p.description},
                {"address", p.address},
                {"phone", p.phone},
                {"category", p.category},
                {"audit_status", p.audit_status},
                {"license_number", p.license_number},
                {"username", user.username},
                {"email", user.email},
                {"created_at", p.created_at},
                {"first_audit_user_id", p.first_audit_user_id},
                {"first_audit_at", p.first_audit_at},
                {"first_audit_comment", p.first_audit_comment},
                {"second_audit_user_id", p.second_audit_user_id},
                {"second_audit_at", p.second_audit_at},
                {"second_audit_comment", p.second_audit_comment}
            });
        }
        
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/audit/providers/pending", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        auto& db = DatabaseService::getInstance();
        auto providers = db.getProvidersByAuditStatus("pending");
        
        json result = json::array();
        for (auto& p : providers) {
            auto user = db.getUserById(p.user_id);
            result.push_back({
                {"id", p.id},
                {"name", p.name},
                {"description", p.description},
                {"address", p.address},
                {"phone", p.phone},
                {"category", p.category},
                {"audit_status", p.audit_status},
                {"license_number", p.license_number},
                {"username", user.username},
                {"email", user.email},
                {"created_at", p.created_at}
            });
        }
        
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/audit/providers/first_pending", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        auto& db = DatabaseService::getInstance();
        auto providers = db.getAllProviders();
        
        json result = json::array();
        for (auto& p : providers) {
            if (p.audit_status == "pending") {
                auto user = db.getUserById(p.user_id);
                result.push_back({
                    {"id", p.id},
                    {"name", p.name},
                    {"description", p.description},
                    {"address", p.address},
                    {"phone", p.phone},
                    {"category", p.category},
                    {"audit_status", p.audit_status},
                    {"license_number", p.license_number},
                    {"username", user.username},
                    {"email", user.email},
                    {"created_at", p.created_at}
                });
            }
        }
        
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/audit/providers/second_pending", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        auto& db = DatabaseService::getInstance();
        auto providers = db.getAllProviders();
        
        json result = json::array();
        for (auto& p : providers) {
            if (p.audit_status == "first_approved") {
                auto user = db.getUserById(p.user_id);
                result.push_back({
                    {"id", p.id},
                    {"name", p.name},
                    {"description", p.description},
                    {"address", p.address},
                    {"phone", p.phone},
                    {"category", p.category},
                    {"audit_status", p.audit_status},
                    {"license_number", p.license_number},
                    {"username", user.username},
                    {"email", user.email},
                    {"first_audit_user_id", p.first_audit_user_id},
                    {"first_audit_at", p.first_audit_at},
                    {"first_audit_comment", p.first_audit_comment},
                    {"created_at", p.created_at}
                });
            }
        }
        
        res.set_content(result.dump(), "application/json");
    });

    svr.Get("/api/audit/providers/:id/records", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        int providerId = std::stoi(req.get_param_value("id"));
        auto& db = DatabaseService::getInstance();
        
        auto records = db.getAuditRecordsByProvider(providerId);
        
        json result = json::array();
        for (auto& r : records) {
            result.push_back({
                {"id", r.id},
                {"provider_id", r.provider_id},
                {"audit_stage", r.audit_stage},
                {"status", r.status},
                {"auditor_id", r.auditor_id},
                {"auditor_name", r.auditor_name},
                {"comment", r.comment},
                {"created_at", r.created_at}
            });
        }
        
        res.set_content(result.dump(), "application/json");
    });

    svr.Post("/api/audit/providers/:id/first", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        int providerId = std::stoi(req.get_param_value("id"));
        auto body = json::parse(req.body);
        
        std::string status = body["status"];
        std::string comment = body["comment"];
        int auditorId = body["auditor_id"];
        std::string auditorName = body["auditor_name"];
        
        if (status != "approved" && status != "rejected") {
            res.status = 400;
            res.set_content(json{{"error", "审核状态只能是approved或rejected"}}.dump(), "application/json");
            return;
        }
        
        auto& db = DatabaseService::getInstance();
        
        if (db.firstAuditProvider(providerId, status, comment, auditorId, auditorName)) {
            auto provider = db.getProviderById(providerId);
            auto user = db.getUserById(provider.user_id);
            
            std::string notificationTitle = status == "approved" ? "审核初审通过" : "审核初审驳回";
            std::string notificationMessage = status == "approved" ? "您的服务商申请已通过初审，等待复审。" : "您的服务商申请未通过初审：" + comment;
            
            models::Notification notification{};
            notification.user_id = user.id;
            notification.title = notificationTitle;
            notification.message = notificationMessage;
            notification.type = "audit";
            db.createNotification(notification);
            
            res.set_content(json{
                {"message", "初审操作成功"},
                {"provider_id", providerId},
                {"audit_stage", "first"},
                {"status", status}
            }.dump(), "application/json");
        } else {
            res.status = 500;
            res.set_content(json{{"error", "初审操作失败"}}.dump(), "application/json");
        }
    });

    svr.Post("/api/audit/providers/:id/second", [](const httplib::Request& req, httplib::Response& res) {
        AuthUser authUser{};
        if (!AuthMiddleware::requireAuth(req, res, authUser)) return;
        if (authUser.role != "admin") {
            res.status = 403;
            res.set_content(json{{"error", "无权限访问"}}.dump(), "application/json");
            return;
        }

        int providerId = std::stoi(req.get_param_value("id"));
        auto body = json::parse(req.body);
        
        std::string status = body["status"];
        std::string comment = body["comment"];
        int auditorId = body["auditor_id"];
        std::string auditorName = body["auditor_name"];
        
        if (status != "approved" && status != "rejected") {
            res.status = 400;
            res.set_content(json{{"error", "审核状态只能是approved或rejected"}}.dump(), "application/json");
            return;
        }
        
        auto& db = DatabaseService::getInstance();
        auto provider = db.getProviderById(providerId);
        
        if (provider.audit_status != "first_approved") {
            res.status = 400;
            res.set_content(json{{"error", "服务商未通过初审，无法进行复审"}}.dump(), "application/json");
            return;
        }
        
        if (db.secondAuditProvider(providerId, status, comment, auditorId, auditorName)) {
            auto user = db.getUserById(provider.user_id);
            
            std::string notificationTitle = status == "approved" ? "审核通过" : "审核驳回";
            std::string notificationMessage = status == "approved" ? "恭喜！您的服务商申请已通过审核，可以开始发布服务了。" : "您的服务商申请未通过审核：" + comment;
            
            models::Notification notification{};
            notification.user_id = user.id;
            notification.title = notificationTitle;
            notification.message = notificationMessage;
            notification.type = "audit";
            db.createNotification(notification);
            
            res.set_content(json{
                {"message", "复审操作成功"},
                {"provider_id", providerId},
                {"audit_stage", "second"},
                {"status", status}
            }.dump(), "application/json");
        } else {
            res.status = 500;
            res.set_content(json{{"error", "复审操作失败"}}.dump(), "application/json");
        }
    });
}