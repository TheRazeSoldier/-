#pragma once
#include <httplib.h>

class AuditController {
public:
    static void registerRoutes(httplib::Server& svr);
};