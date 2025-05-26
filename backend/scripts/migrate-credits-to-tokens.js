// backend/scripts/migrate-credits-to-tokens.js
// Run this script ONCE to migrate existing users from credits to tokens

const { db } = require("../services/firebase-admin");

const FREE_TOKENS_AMOUNT = 50000;
const CREDIT_TO_TOKEN_RATIO = 1000; // 1 credit = 1000 tokens (rough conversion)

async function migrateCreditToTokens() {
  try {
    console.log("🔄 Starting migration from credits to tokens...");

    // Get all users
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.docs.length;

    console.log(`👥 Found ${totalUsers} users to migrate`);

    let migrated = 0;
    let alreadyMigrated = 0;
    let newTokensGranted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      const updates = {};
      let needsUpdate = false;

      // Skip if already has tokens (already migrated)
      if (userData.tokens && userData.tokens > 0) {
        alreadyMigrated++;
        console.log(
          `✅ User ${userData.email} already has ${userData.tokens} tokens`
        );
        continue;
      }

      // Convert credits to tokens
      if (userData.credits && userData.credits > 0) {
        updates.tokens = userData.credits * CREDIT_TO_TOKEN_RATIO;
        updates.credits = 0; // Clear old credits
        needsUpdate = true;
        console.log(
          `🔄 Converting ${userData.credits} credits to ${updates.tokens} tokens for ${userData.email}`
        );
      } else {
        // User has no credits, start with 0 tokens
        updates.tokens = 0;
        needsUpdate = true;
      }

      // Grant free tokens if email is verified and not already granted
      if (userData.emailVerified && !userData.freeTokensGranted) {
        updates.tokens = (updates.tokens || 0) + FREE_TOKENS_AMOUNT;
        updates.freeTokensGranted = true;
        updates.freeTokensGrantedAt = new Date();
        newTokensGranted++;
        console.log(
          `🎁 Granted ${FREE_TOKENS_AMOUNT} free tokens to ${userData.email}`
        );
        needsUpdate = true;
      }

      // Add missing fields
      if (!userData.totalTokensUsed) {
        updates.totalTokensUsed = 0;
        needsUpdate = true;
      }

      if (!userData.freeTokensGranted) {
        updates.freeTokensGranted = false;
        needsUpdate = true;
      }

      if (!userData.emailVerified) {
        updates.emailVerified = false;
        needsUpdate = true;
      }

      if (!userData.lastActiveAt) {
        updates.lastActiveAt =
          userData.updatedAt || userData.createdAt || new Date();
        needsUpdate = true;
      }

      updates.updatedAt = new Date();

      if (needsUpdate) {
        await db.collection("users").doc(userId).update(updates);
        migrated++;
        console.log(`✅ Migrated user: ${userData.email}`);
      }
    }

    console.log("\n🎉 Migration completed!");
    console.log(`📊 Migration Summary:`);
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Migrated: ${migrated}`);
    console.log(`   - Already migrated: ${alreadyMigrated}`);
    console.log(`   - New free tokens granted: ${newTokensGranted}`);
    console.log(
      `   - Total free tokens distributed: ${
        newTokensGranted * FREE_TOKENS_AMOUNT
      }`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCreditToTokens()
    .then(() => {
      console.log("✅ Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateCreditToTokens };
