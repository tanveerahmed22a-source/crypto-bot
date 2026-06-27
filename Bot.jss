const BOT_TOKEN = "8625844708:AAF_ZGlkT8I2SBuMAGmHeul8kZuSuzoJC6E";
const CHANNEL_ID = "-1004260207873";
const ADMIN_ID = "8927268135";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text, keyboard = null) {
  const body = { chat_id: chatId, text: text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = keyboard;
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createInviteLink() {
  const res = await fetch(`${API}/createChatInviteLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, member_limit: 1, name: "VIP Member" }),
  });
  const data = await res.json();
  return data.result?.invite_link || null;
}

async function handleUpdate(update) {
  if (update.message?.text === "/start") {
    const userId = update.message.from.id;
    const firstName = update.message.from.first_name || "User";
    await sendMessage(userId,
      `🚀 <b>Welcome to CryptoEdge Signals!</b>\n\nHello <b>${firstName}</b>! 👋\n\nTo get VIP access, send USDT (TRC20) to:\n<code>TMp4hXC9xKTmuYstYVdG18Qk57wN1kkrYU</code>\n\n💰 Plans:\n• Starter — <b>15 USDT</b>/month\n• Pro — <b>35 USDT</b>/month\n• Elite — <b>80 USDT</b>/month\n\nAfter payment, send:\n<code>/paid [amount] [txid]</code>\n\nExample: <code>/paid 35 abc123</code>\n\n⏱ Verified within 30 minutes!`
    );
    return;
  }

  if (update.message?.text?.startsWith("/paid")) {
    const userId = update.message.from.id;
    const username = update.message.from.username || "No username";
    const firstName = update.message.from.first_name || "User";
    const parts = update.message.text.split(" ");
    const amount = parts[1] || "?";
    const txid = parts[2] || "Not provided";
    await sendMessage(userId,
      `✅ <b>Received!</b>\n\nAmount: <b>${amount} USDT</b>\nTxID: <code>${txid}</code>\n\nVerification within <b>30 minutes</b>. Invite link will be sent here! 🎯`
    );
    await sendMessage(ADMIN_ID,
      `🔔 <b>NEW PAYMENT!</b>\n\n👤 ${firstName}\n📱 @${username}\n🆔 <code>${userId}</code>\n💰 ${amount} USDT\n🔗 <code>${txid}</code>`,
      { inline_keyboard: [[
        { text: "✅ Approve", callback_data: `approve_${userId}` },
        { text: "❌ Reject", callback_data: `reject_${userId}` }
      ]]}
    );
    return;
  }

  if (update.message?.text?.startsWith("/approve") && String(update.message.from.id) === ADMIN_ID) {
    const targetId = update.message.text.split(" ")[1];
    const link = await createInviteLink();
    if (link) {
      await sendMessage(targetId, `🎉 <b>Approved! Welcome to CryptoEdge VIP!</b>\n\nYour invite link:\n${link}\n\n⚠️ Single use only!\n📈 Daily signals start now! 🚀`);
      await sendMessage(ADMIN_ID, `✅ Invite sent to ${targetId}`);
    }
    return;
  }

  if (update.message?.text?.startsWith("/reject") && String(update.message.from.id) === ADMIN_ID) {
    const targetId = update.message.text.split(" ")[1];
    await sendMessage(targetId, `❌ <b>Payment Not Verified</b>\n\nPlease check your TxID and resend with /paid command.`);
    await sendMessage(ADMIN_ID, `✅ Rejection sent to ${targetId}`);
    return;
  }

  if (update.message?.text?.startsWith("/signal") && String(update.message.from.id) === ADMIN_ID) {
    const signalText = update.message.text.replace("/signal ", "").trim();
    await sendMessage(CHANNEL_ID, `📊 <b>CRYPTOEDGE VIP SIGNAL</b>\n\n${signalText}\n\n⚡ Trade wisely! 🔐`);
    await sendMessage(ADMIN_ID, "✅ Signal sent!");
    return;
  }

  if (update.callback_query) {
    const data = update.callback_query.data;
    await fetch(`${API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: update.callback_query.id }),
    });
    if (data.startsWith("approve_")) {
      const targetId = data.replace("approve_", "");
      const link = await createInviteLink();
      if (link) {
        await sendMessage(targetId, `🎉 <b>Approved! Welcome to CryptoEdge VIP!</b>\n\nYour invite link:\n${link}\n\n⚠️ Single use only! 🚀`);
        await sendMessage(ADMIN_ID, `✅ Approved! Invite sent to ${targetId}`);
      }
    }
    if (data.startsWith("reject_")) {
      const targetId = data.replace("reject_", "");
      await sendMessage(targetId, `❌ <b>Payment Not Verified</b>\n\nPlease resend with correct TxID.`);
      await sendMessage(ADMIN_ID, `✅ Rejection sent to ${targetId}`);
    }
  }
}

let lastUpdateId = 0;
async function poll() {
  try {
    const res = await fetch(`${API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
  setTimeout(poll, 1000);
}

console.log("🚀 CryptoEdge Bot started!");
poll();
