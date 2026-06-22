import { checkAndUpdateSubscriptionExpiry } from "../controllers/subscriptionController.js";

/**
 * Middleware: requirePro
 * Validates that the business has a valid, active Pro subscription.
 * Automatically handles expired subscriptions and updates database records dynamically.
 */
export const requirePro = async (req, res, next) => {
  try {
    const businessId = req.user?.business_id;

    if (!businessId) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Business authentication required.",
      });
    }

    const currentSub = await checkAndUpdateSubscriptionExpiry(businessId);

    if (currentSub.plan_name !== "pro" || currentSub.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: This resource requires an active Pro subscription plan.",
        data: currentSub,
      });
    }

    // Attach current subscription status to requests
    req.subscription = currentSub;
    next();
  } catch (error) {
    console.error("Error inside requirePro middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred checking subscription state.",
      error: error.message,
    });
  }
};
