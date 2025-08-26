const Plan = require("../model/planModel");
const Payment = require("../model/paymentModel");

// Replace with actual ethers/web3 contract instance
const contract = {
  async payment(userAddress, amount) {
    console.log(
      `Simulating contract.payment for ${userAddress}, amount: ${amount}`
    );
    // Example with ethers:
    // const tx = await contractInstance.payment(userAddress, amount);
    // await tx.wait();
    return true;
  },
};

// Helpers
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfTomorrow() {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function processPayments() {
  try {
    const todayStart = startOfToday();
    const tomorrowStart = startOfTomorrow();

    // Only those due today (not overdue, not early)
    const duePlans = await Plan.find({
      status: "active",
      nextPayment: { $gte: todayStart, $lt: tomorrowStart },
    });

    console.log(`Found ${duePlans.length} plans due today.`);

    for (const plan of duePlans) {
      try {
        // Idempotency guard: if lastPayment is already today, skip
        if (plan.lastPayment && isSameDay(plan.lastPayment, todayStart)) {
          console.log(
            `Skipping Plan ${plan.planId} — already processed today.`
          );
          continue;
        }

        // 1) Call contract
        await contract.payment(plan.userAddress, plan.intervalPayable);

        // 2) Update tracking fields
        const now = new Date();
        plan.lastPayment = now;

        // Compute next payment from today's window (not from `now.setDate` mutating)
        const next = new Date(plan.nextPayment || todayStart);
        if (plan.paymentInterval === "daily") {
          next.setDate(next.getDate() + 1);
          plan.daysCompleted = (plan.daysCompleted || 0) + 1;
        } else {
          next.setDate(next.getDate() + 7);
          plan.daysCompleted = (plan.daysCompleted || 0) + 7;
        }
        plan.nextPayment = next;

        plan.totalPaid = (plan.totalPaid || 0) + (plan.intervalPayable || 0);
        plan.streak = (plan.streak || 0) + 1;

        await plan.save();
        console.log(`✅ Processed Plan ${plan.planId}`);
      } catch (err) {
        console.error(`❌ Error processing Plan ${plan.planId}:`, err);
      }
    }

    console.log("🎉 Finished processing today's payments.");
    process.exit(0);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

module.exports = {
  processPayments,
};
