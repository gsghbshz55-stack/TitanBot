async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;

    // 1. التحقق من أن القناة عبارة عن تكت (اسم الروم يبدأ بـ ticket-)
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    // 2. جلب آخر الرسائل للتأكد هل هذه أول رسالة للعضو أم لا
    const fetchedMessages = await channel.messages.fetch({ limit: 5 });
    const nonBotMessages = fetchedMessages.filter(msg => !msg.author.bot);

    // إذا كانت هذه الرسالة هي أول رسالة يكتبها العضو في التكت
    if (nonBotMessages.size <= 1) {
      
      // أخذ أول كلمة كتبها العضو
      const firstWord = message.content.trim().split(/\s+/)[0];
      if (!firstWord) return;

      // تنظيف الكلمة (تقبل العربي، الإنجليزي، والأرقام)
      const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');

      if (cleanWord.length > 0) {
        // استخراج رقم التكت من الاسم الحالي (مثال: ticket-0897 أو 0897)
        const ticketNumberMatch = channel.name.match(/\d+/);
        const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '0000';

        // تشكيل الاسم الجديد (الرقم - الكلمة الأولى)
        const newName = `${ticketNumber}-${cleanWord}`;

        // إرسال الرسالة الترحيبية وتغيير الاسم معاً
        await channel.send({
          content: `مرحباً بيك، سوف يتم تغير اسم تكت خاص بيك علي اول كلمة تكتبه لتسهيل العملية وشكرا مع اطيب تحياتي دعم فني <:emoji141:1556273384986378311>`
        }).catch(() => {});

        await channel.setName(newName);
        logger.info(`Ticket renamed successfully to ${newName}`);
      }
    }
  } catch (error) {
    logger.error('Error handling ticket rename (Make sure Bot has Manage Channels permission):', error);
  }
}
