async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;

    // 1. التحقق من أن القناة عبارة عن تكت (تبدأ بـ ticket-)
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    // 2. إذا كان اسم القناة يحتوي على شرطة ورقم وثم كلمة أخرى (يعني تم تغيير اسمه مسبقاً)، فلا تكرر العملية
    // شكل الاسم الافتراضي للتكت عادة يكون: ticket-0001 أو ticket-123
    // فإذا كان الاسم يحتوي على أكثر من شرطة أو كلمة مخصصة، نتوقف
    const parts = channel.name.split('-');
    if (parts.length > 2) return; // تم تغيير اسمه من قبل

    // 3. أخذ أول كلمة كتبها العضو
    const firstWord = message.content.trim().split(/\s+/)[0];
    if (!firstWord) return;

    // تنظيف الكلمة (تقبل العربي، الإنجليزي، والأرقام)
    const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');

    if (cleanWord.length > 0) {
      // استخراج رقم التكت من الاسم الحالي (مثال: ticket-0897 -> 0897)
      const ticketNumberMatch = channel.name.match(/\d+/);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '0000';

      // تشكيل الاسم الجديد (الرقم - الكلمة الأولى)
      const newName = `${ticketNumber}-${cleanWord}`;

      // إرسال الرسالة الترحيبية أولاً
      await channel.send({
        content: `مرحباً بيك، سوف يتم تغير اسم تكت خاص بيك علي اول كلمة تكتبه لتسهيل العملية وشكرا مع اطيب تحياتي دعم فني <:emoji141:1556273384986378311>`
      }).catch(() => {});

      // تغيير اسم القناة فوراً
      await channel.setName(newName);
      logger.info(`Ticket renamed successfully to ${newName}`);
    }
  } catch (error) {
    logger.error('Error handling ticket rename (Make sure Bot has Manage Channels permission):', error);
  }
}
