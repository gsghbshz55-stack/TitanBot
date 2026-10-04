async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;

    // 1. التحقق من أن القناة عبارة عن تكت (تبدأ بـ ticket-)
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    // 2. التحقق من أن هذه أول رسالة يرسلها عضو (غير البوتات)
    const messages = await channel.messages.fetch({ limit: 15 });
    const userMessages = messages.filter(msg => !msg.author.bot);

    if (userMessages.size === 1) {
      // إرسال الرسالة الترحيبية المنسقة بالإيموجي الجديد
      await channel.send({
        content: `مرحباً بيك، سوف يتم تغير اسم تكت خاص بيك علي اول كلمة تكتبه لتسهيل العملية وشكرا مع اطيب تحياتي دعم فني <:emoji141:1556273384986378311>`
      }).catch(() => {});

      // استخراج رقم التكت من الاسم الحالي (مثال: 0897)
      const ticketNumberMatch = channel.name.match(/\d+/);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '';

      // أخذ أول كلمة كتبها العضو لتغيير الاسم بها
      const firstWord = message.content.trim().split(/\s+/)[0];
      if (!firstWord) return;

      // تنظيف الكلمة لتقبل الأحرف العربية والإنجليزية والأرقام
      const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');

      if (cleanWord.length > 0) {
        // تشكيل الاسم الجديد (الرقم - الكلمة الأولى)
        const newName = ticketNumber ? `${ticketNumber}-${cleanWord}` : cleanWord;

        await channel.setName(newName);
        logger.info(`Ticket renamed to ${newName} by ${message.author.tag}`);
      }
    }
  } catch (error) {
    logger.error('Error handling ticket rename/welcome:', error);
  }
}
