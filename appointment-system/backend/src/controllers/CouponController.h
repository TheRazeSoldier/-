#pragma once
#include "../../include/httplib.h"

class CouponController {
public:
    static void registerRoutes(httplib::Server& svr);
};