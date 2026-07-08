#pragma once
#include "../../include/httplib.h"

class RecommendController {
public:
    static void registerRoutes(httplib::Server& svr);
};