// ============================================================
// TARJIMA LUG'ATI
//
// KALIT = kirill o'zbekcha matnning O'ZI. Nega shunday:
//   - kalit o'ylab topish shart emas, kod o'qilishli qoladi;
//   - tarjima topilmasa matn kirill holicha chiqadi, ya'ni hech
//     qachon bo'sh joy yoki «missing.key» ko'rinmaydi;
//   - kirill — standart til, demak standart yo'l eng arzoni.
//
// `latn` faqat transliteratsiya noto'g'ri natija bergan joylarda
// beriladi (ruscha atamalar: «Нарастающий» -> «Narastayushiy» emas,
// «Yig'indi bilan» bo'lishi kerak). Qolgan hamma joyda lotin yozuvi
// translit.ts orqali AVTOMATIK chiqadi.
// ============================================================

export interface Entry {
  /** Faqat transliteratsiya noto'g'ri bo'lganda */
  latn?: string;
  ru: string;
  en: string;
}

export const DICTIONARY: Record<string, Entry> = {
  // ---------- Umumiy / navigatsiya ----------
  'Тизимга кириш': { ru: 'Вход в систему', en: 'Sign in' },
  'Тизимдан чиқиш': { ru: 'Выйти из системы', en: 'Sign out' },
  'Чиқиш': { ru: 'Выход', en: 'Sign out' },
  'Сверка': { latn: 'Sverka', ru: 'Сверка', en: 'Reconciliation' },
  'Таҳлил': { ru: 'Анализ', en: 'Analysis' },
  'Ҳисоблаш': { ru: 'Расчёт', en: 'Calculate' },
  'Сақлаш': { ru: 'Сохранить', en: 'Save' },
  'Сақланмоқда...': { ru: 'Сохранение...', en: 'Saving...' },
  'Ўқилмоқда...': { ru: 'Чтение...', en: 'Reading...' },
  'Текширилмоқда...': { ru: 'Проверка...', en: 'Checking...' },
  'Маълумотлар юкланмоқда...': { ru: 'Загрузка данных...', en: 'Loading data...' },
  'Аудит маълумотлари юкланмоқда...': { ru: 'Загрузка данных аудита...', en: 'Loading audit data...' },
  'Очиш': { ru: 'Открыть', en: 'Open' },
  'Ёпиш': { ru: 'Закрыть', en: 'Close' },
  'кўриш': { ru: 'показать', en: 'show' },
  'яшириш': { ru: 'скрыть', en: 'hide' },
  'янги': { ru: 'новый', en: 'new' },
  'таниш': { ru: 'известный', en: 'known' },
  'барчаси': { ru: 'все', en: 'all' },
  'Тунги/Кундузги режим': { ru: 'Ночной/Дневной режим', en: 'Dark / light mode' },
  'Тилни танлаш': { ru: 'Выбор языка', en: 'Choose language' },

  // ---------- Kontragent va jadval ----------
  'Фирма номлари': { ru: 'Наименование фирмы', en: 'Company name' },
  'Корхона Номи': { ru: 'Наименование предприятия', en: 'Company name' },
  'Контрагент номи ёки СТИР бўйича қидирув...': { ru: 'Поиск по названию контрагента или ИНН...', en: 'Search by counterparty name or TIN...' },
  'Фирма номи ёки СТИР бўйича қидирув...': { ru: 'Поиск по названию фирмы или ИНН...', en: 'Search by company name or TIN...' },
  'Фирма номи ёки СТИР бўйича излаш...': { ru: 'Поиск по названию фирмы или ИНН...', en: 'Search by company name or TIN...' },
  'СТИР': { ru: 'ИНН', en: 'TIN' },
  'СТИР (ИНН)': { ru: 'ИНН', en: 'TIN' },
  'Изоҳ': { ru: 'Примечание', en: 'Note' },
  'Ойлар': { ru: 'Месяцы', en: 'Months' },
  'Ойма-ой': { ru: 'Помесячно', en: 'Monthly' },
  '📅 Ойма-ой': { ru: '📅 Помесячно', en: '📅 Monthly' },
  'Сана': { ru: 'Дата', en: 'Date' },
  'Сумма': { ru: 'Сумма', en: 'Amount' },
  'Ҳужжат №': { ru: 'Документ №', en: 'Document no.' },
  'Тўлов мақсади': { ru: 'Назначение платежа', en: 'Payment purpose' },
  'Ҳаракат': { ru: 'Операция', en: 'Transaction' },
  'Қатор': { ru: 'Строк', en: 'Rows' },
  'Формат': { ru: 'Формат', en: 'Format' },
  'Файл / варақ': { ru: 'Файл / лист', en: 'File / sheet' },
  'Файл якуни': { ru: 'Итог файла', en: 'File total' },
  'Фирма топилмади': { ru: 'Фирма не найдена', en: 'Company not found' },
  'Ойлик маълумот йўқ': { ru: 'Нет помесячных данных', en: 'No monthly data' },

  // ---------- Summalar ----------
  'ЖАМИ': { ru: 'ИТОГО', en: 'TOTAL' },
  'ЖАМИ:': { ru: 'ИТОГО:', en: 'TOTAL:' },
  'ЖАМИ пул': { ru: 'ИТОГО сумма', en: 'TOTAL amount' },
  'ЖАМИ фарқи': { ru: 'ИТОГО разница', en: 'TOTAL difference' },
  'ЖАМИ счет-ф': { ru: 'ИТОГО счета-фактуры', en: 'TOTAL invoices' },
  'Жами танланганлар:': { ru: 'Итого по выбранным:', en: 'Total for selected:' },
  'Жами чиққан пул': { ru: 'Всего исходящих платежей', en: 'Total money out' },
  'Жами келган счёт-фактура': { ru: 'Всего полученных счетов-фактур', en: 'Total invoices received' },
  'Чиққан пул': { ru: 'Исходящие платежи', en: 'Money out' },
  'Чиққан пул жами': { ru: 'Исходящие платежи, итого', en: 'Money out, total' },
  'Чиққан пул (Дебет)': { ru: 'Исходящие платежи (дебет)', en: 'Money out (debit)' },
  'Келган пул': { ru: 'Поступления', en: 'Money in' },
  'Келган пул жами': { ru: 'Поступления, итого', en: 'Money in, total' },
  'Келган': { ru: 'Получено', en: 'Received' },
  'Келган счет-ф жами': { ru: 'Полученные счета-фактуры, итого', en: 'Invoices received, total' },
  'Келган счет-ф (Кредит)': { ru: 'Полученные счета-фактуры (кредит)', en: 'Invoices received (credit)' },
  'Юборилган счет-ф': { ru: 'Выставленные счета-фактуры', en: 'Invoices issued' },
  'Юборилган счет-ф жами': { ru: 'Выставленные счета-фактуры, итого', en: 'Invoices issued, total' },
  'Умумий Чиқим (Дебет)': { ru: 'Общий расход (дебет)', en: 'Total outflow (debit)' },
  'Умумий Кирим (Кредит)': { ru: 'Общий приход (кредит)', en: 'Total inflow (credit)' },
  'Чиқим (Банк)': { ru: 'Расход (банк)', en: 'Outflow (bank)' },
  'Кирим (Фактура)': { ru: 'Приход (счёт-фактура)', en: 'Inflow (invoice)' },
  'Дебет (фактура)': { ru: 'Дебет (счёт-фактура)', en: 'Debit (invoice)' },
  'Кредит (тўлов)': { ru: 'Кредит (оплата)', en: 'Credit (payment)' },
  'Фарқ': { ru: 'Разница', en: 'Difference' },
  'Фарқи': { ru: 'Разница', en: 'Difference' },
  'Сальдо': { ru: 'Сальдо', en: 'Balance' },
  'Қолдиқ (Сальдо)': { ru: 'Остаток (сальдо)', en: 'Balance' },
  'Ўтган даврдан': { ru: 'С прошлого периода', en: 'From prior period' },
  'Аванс': { ru: 'Аванс', en: 'Advance' },
  'Тўловлар': { ru: 'Платежи', en: 'Payments' },

  // ---------- Davr ----------
  'Давр': { ru: 'Период', en: 'Period' },
  'Йил': { ru: 'Год', en: 'Year' },
  'Йиллар': { ru: 'Годы', en: 'Years' },
  'Ой': { ru: 'Месяц', en: 'Month' },
  'Барча давр': { ru: 'Весь период', en: 'All periods' },
  'Йил бўйича': { ru: 'За год', en: 'Full year' },
  'Санасиз': { ru: 'Без даты', en: 'No date' },
  'Нарастающий': { latn: "Yig'indi bilan", ru: 'Нарастающий', en: 'Cumulative' },
  '2024 йил': { ru: '2024 год', en: '2024' },
  '2025 йил': { ru: '2025 год', en: '2025' },
  '2026 йил': { ru: '2026 год', en: '2026' },

  // ---------- Oy nomlari ----------
  'Январь': { latn: 'Yanvar', ru: 'Январь', en: 'January' },
  'Февраль': { latn: 'Fevral', ru: 'Февраль', en: 'February' },
  'Март': { latn: 'Mart', ru: 'Март', en: 'March' },
  'Апрель': { latn: 'Aprel', ru: 'Апрель', en: 'April' },
  'Май': { latn: 'May', ru: 'Май', en: 'May' },
  'Июнь': { latn: 'Iyun', ru: 'Июнь', en: 'June' },
  'Июль': { latn: 'Iyul', ru: 'Июль', en: 'July' },
  'Август': { latn: 'Avgust', ru: 'Август', en: 'August' },
  'Сентябрь': { latn: 'Sentabr', ru: 'Сентябрь', en: 'September' },
  'Октябрь': { latn: 'Oktabr', ru: 'Октябрь', en: 'October' },
  'Ноябрь': { latn: 'Noyabr', ru: 'Ноябрь', en: 'November' },
  'Декабрь': { latn: 'Dekabr', ru: 'Декабрь', en: 'December' },

  // ---------- Toifa ----------
  'Тоифа': { ru: 'Категория', en: 'Category' },
  'Контрагент тоифаси': { ru: 'Категория контрагента', en: 'Counterparty category' },
  'Корхона': { ru: 'Предприятие', en: 'Company' },
  'Коммунал': { ru: 'Коммунальные', en: 'Utilities' },
  'Бюджет': { ru: 'Бюджет', en: 'Budget' },
  'Банк': { ru: 'Банк', en: 'Bank' },
  'Хизмат': { ru: 'Услуги', en: 'Services' },
  'Фақат корхоналар': { ru: 'Только предприятия', en: 'Companies only' },
  'Коммунал/бюджет': { ru: 'Коммунальные/бюджет', en: 'Utilities / budget' },
  'Ҳаммаси': { ru: 'Все', en: 'All' },
  'ҳисобдан чиқарилмаган': { ru: 'не исключены из расчёта', en: 'not excluded from the totals' },
  'Коммунал, бюджет ва банк комиссияси асосий сверкани чалғитади. Улар йўқолмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ.':
    { ru: 'Коммунальные, бюджетные платежи и банковская комиссия мешают основной сверке. Они не исчезают — «ИТОГО» наверху всегда полное.', en: 'Utilities, budget payments and bank fees clutter the main reconciliation. They are not lost — the TOTAL above is always complete.' },
  'Тоифани сақлаб бўлмади:': { ru: 'Не удалось сохранить категорию:', en: 'Could not save the category:' },

  // ---------- Filtr / holat ----------
  'Барчаси': { ru: 'Все', en: 'All' },
  'Фарқи борлар': { ru: 'С разницей', en: 'With difference' },
  'Тенг бўлганлар': { ru: 'Без разницы', en: 'Matching' },
  'фақат фарқи борлар': { ru: 'только с разницей', en: 'only those with a difference' },
  'фақат тенг бўлганлар': { ru: 'только совпавшие', en: 'only matching ones' },
  'Ҳисоб фактура олиш керак': { ru: 'Нужно получить счёт-фактуру', en: 'Invoice needs to be received' },
  'Ҳисоб фактура ёзиш керак': { ru: 'Нужно выставить счёт-фактуру', en: 'Invoice needs to be issued' },
  'Қарзмиз': { ru: 'Мы должны', en: 'We owe' },
  'Бизга қарздор': { ru: 'Нам должны', en: 'Owed to us' },
  'Бизнинг корхона': { ru: 'Наше предприятие', en: 'Our company' },
  'Пул келган, фактура йўқ': { ru: 'Деньги поступили, счёта-фактуры нет', en: 'Payment received, no invoice' },
  'Фактура бор, пул келмаган': { ru: 'Счёт-фактура есть, оплаты нет', en: 'Invoice issued, not paid' },
  'Фактура йўқ': { ru: 'Нет счёта-фактуры', en: 'No invoice' },
  'Тўлов йўқ': { ru: 'Нет оплаты', en: 'No payment' },
  'Маълумот топилмади... 🕵️‍♂️': { ru: 'Данные не найдены... 🕵️‍♂️', en: 'No data found... 🕵️‍♂️' },

  // ---------- Qarz yoshi ----------
  'Қарз ёши': { ru: 'Возраст задолженности', en: 'Debt age' },
  'Қарз қолдиғи': { ru: 'Остаток задолженности', en: 'Outstanding debt' },
  'Қарздорлик йўқ.': { ru: 'Задолженности нет.', en: 'No outstanding debt.' },
  'Энг эски': { ru: 'Самый старый', en: 'Oldest' },
  '0–30 кун': { ru: '0–30 дней', en: '0–30 days' },
  '31–60 кун': { ru: '31–60 дней', en: '31–60 days' },
  '61–90 кун': { ru: '61–90 дней', en: '61–90 days' },
  '90+ кун': { ru: '90+ дней', en: '90+ days' },

  // ---------- Fayl yuklash ----------
  'Excel / CSV файлларни танланг': { ru: 'Выберите файлы Excel / CSV', en: 'Choose Excel / CSV files' },
  '.xls, .xlsx, .csv — бир нечта файлни бирга юкласа бўлади': { ru: '.xls, .xlsx, .csv — можно загрузить несколько файлов сразу', en: '.xls, .xlsx, .csv — several files can be uploaded at once' },
  'Банк кўчирмаси + фактура реестрини танланг': { ru: 'Выберите банковскую выписку + реестр счетов-фактур', en: 'Choose the bank statement + invoice registry' },
  'Илтимос, камида битта Excel ёки CSV файлни танланг!': { ru: 'Пожалуйста, выберите хотя бы один файл Excel или CSV!', en: 'Please choose at least one Excel or CSV file.' },
  'Камида битта файл танланг: банк кўчирмаси ва/ёки юборилган фактуралар реестри.': { ru: 'Выберите хотя бы один файл: банковскую выписку и/или реестр выставленных счетов-фактур.', en: 'Choose at least one file: a bank statement and/or the issued-invoice registry.' },
  'Аниқланган форматлар:': { ru: 'Распознанные форматы:', en: 'Detected formats:' },
  '✓ Ўқиш ҳисоботи': { ru: '✓ Отчёт о чтении', en: '✓ Parsing report' },
  'Ҳисобга олинмади:': { ru: 'Не учтено:', en: 'Not counted:' },
  'Excel юклаш': { ru: 'Выгрузить в Excel', en: 'Export to Excel' },

  // ---------- Faktura ----------
  'Фактура': { latn: 'Faktura', ru: 'Счёт-фактура', en: 'Invoice' },
  'Фактуралар': { latn: 'Fakturalar', ru: 'Счета-фактуры', en: 'Invoices' },
  'Счёт-фактура': { latn: 'Hisob-faktura', ru: 'Счёт-фактура', en: 'Invoice' },
  '«Подтверждён»': { latn: '«Tasdiqlangan»', ru: '«Подтверждён»', en: '“Confirmed”' },
  'Ожидает подписи партнёра': { latn: 'Hamkor imzosini kutmoqda', ru: 'Ожидает подписи партнёра', en: 'Awaiting partner signature' },
  '— одатда ҳисобланмайди (имзоланмаган фактура кучга кирмаган)': { ru: '— обычно не учитывается (неподписанный счёт-фактура не вступил в силу)', en: '— normally not counted (an unsigned invoice is not yet in force)' },
  'Далолатнома (Сверка)': { latn: 'Dalolatnoma (Sverka)', ru: 'Акт сверки', en: 'Reconciliation act' },
  'Шу фирма учун Акт сверки юклаб олиш': { ru: 'Скачать акт сверки по этой фирме', en: 'Download the reconciliation act for this company' },

  // ---------- Korxona boshqaruvi ----------
  'Янги Корхона Қўшиш': { ru: 'Добавить предприятие', en: 'Add a company' },
  'Корхонани ўчириш': { ru: 'Удалить предприятие', en: 'Delete company' },

  // ---------- Xatoliklar ----------
  'Хатолик:': { ru: 'Ошибка:', en: 'Error:' },
  'Юклашда хато:': { ru: 'Ошибка загрузки:', en: 'Upload error:' },
  'Номаълум хато': { ru: 'Неизвестная ошибка', en: 'Unknown error' },
  'Номаълум хатолик юз берди': { ru: 'Произошла неизвестная ошибка', en: 'An unknown error occurred' },
  'Номаълум хатолик юз берди.': { ru: 'Произошла неизвестная ошибка.', en: 'An unknown error occurred.' },
  'Сақлашда хатолик юз берди.': { ru: 'Произошла ошибка при сохранении.', en: 'An error occurred while saving.' },
  'Сервер билан уланишда хатолик!': { ru: 'Ошибка соединения с сервером!', en: 'Could not connect to the server.' },
  'Firebase хатолиги:': { ru: 'Ошибка Firebase:', en: 'Firebase error:' },
  'Сақлаш учун камида битта фирмани белгиланг!': { ru: 'Отметьте хотя бы одну фирму для сохранения!', en: 'Select at least one company to save.' },
  'Рўйхат бўш. Камида битта фирмани белгиланг!': { ru: 'Список пуст. Отметьте хотя бы одну фирму!', en: 'The list is empty. Select at least one company.' },
  'Рўйхат бўш. Камида битта контрагентни белгиланг!': { ru: 'Список пуст. Отметьте хотя бы одного контрагента!', en: 'The list is empty. Select at least one counterparty.' },

  // ---------- Чиқим сверкаси саҳифаси ----------
  'Банк айланмаси ва Э-Фактура файлларни юкланг, таҳрирланг ва таҳлил қилинг.': { ru: 'Загрузите файлы банковских оборотов и Э-Фактуры, отредактируйте и проанализируйте.', en: 'Upload bank turnover and e-invoice files, edit them and run the analysis.' },
  'та файл танланди': { ru: 'файл(ов) выбрано', en: 'file(s) selected' },
  'та эслатма': { ru: 'замечание(й)', en: 'notice(s)' },
  'фактураларни ҳам ҳисоблаш': { ru: 'счета-фактуры тоже учитывать', en: 'count these invoices too' },
  'Янги шакл ўрганилди': { ru: 'Новый формат изучен', en: 'New layout learned' },
  'Тизим таниган экспорт шакллари': { ru: 'Форматы экспорта, известные системе', en: 'Export layouts known to the system' },
  // ---------- Ягона луғат (2026-08-13) ----------
  // Қоида: фойдаланувчига ПУЛ ЙЎНАЛИШИ кўрсатилади, ҳисоб рақами
  // атамаси эмас. «Дебет/Кредит/Сальдо» фақат икки жойда қолди:
  //   1) «Ўқиш ҳисоботи» — у ерда бухгалтер файлни текширади;
  //   2) АКТ СВЕРКИ — расмий икки томонлама ҳужжат шакли.
  // Батафсил: MAHSULOT-QARORLARI.md, 2-бўлим.
  'Тўланган пул': { ru: 'Оплачено', en: 'Money paid out' },
  'Жами тўланган пул': { ru: 'Всего оплачено', en: 'Total paid out' },
  'Умумий тўланган пул': { ru: 'Всего оплачено', en: 'Total paid out' },
  'Тушган пул': { ru: 'Поступило', en: 'Money received' },
  'Жами тушган пул': { ru: 'Всего поступило', en: 'Total received' },
  'Умумий тушган пул': { ru: 'Всего поступило', en: 'Total received' },
  'Келган фактура': { ru: 'Полученные счета-фактуры', en: 'Invoices received' },
  'Жами келган фактура': { ru: 'Всего получено счетов-фактур', en: 'Total invoices received' },
  'Ёзилган фактура': { ru: 'Выставленные счета-фактуры', en: 'Invoices issued' },
  'Ёзилган фактуралар': { ru: 'Выставленные счета-фактуры', en: 'Invoices issued' },
  'Жами ёзилган фактура': { ru: 'Всего выставлено счетов-фактур', en: 'Total invoices issued' },
  'ЖАМИ фактура': { ru: 'ВСЕГО счетов-фактур', en: 'TOTAL invoices' },
  'фактура': { ru: 'счёт-фактура', en: 'invoice' },
  // «Фарқ» юқорида (умумий бўлимда) аллақачон бор
  'Йил бошидан': { latn: 'Yil boshidan', ru: 'С начала года', en: 'Year to date' },
  'Имзо кутилаётган фактураларни ҳам ҳисоблаш': {
    ru: 'Учитывать и счета-фактуры, ожидающие подписи',
    en: 'Count invoices awaiting signature too',
  },
  'Ортиқча тушган': { ru: 'Переплата', en: 'Overpaid' },
  'Улар қарздор — мижоз': { ru: 'Долг в нашу пользу — клиент', en: 'They owe us — the client' },
  'Биз қарздормиз —': { ru: 'Долг в пользу клиента —', en: 'We owe them —' },
  'сўм ортиқча тушган.': { ru: 'сум поступило сверх суммы.', en: 'received in excess.' },
  'Тўланган пул ↔ келган фактура: фарқни топади': {
    ru: 'Оплачено ↔ полученные счета-фактуры: находит разницу',
    en: 'Money paid ↔ invoices received: finds the gap',
  },
  'Тўланган пул ↔ келган фактура. Ким қанча ортиқча тўлаган, ким фактура ёзиб бермаган — бир қарашда.': {
    ru: 'Оплачено ↔ полученные счета-фактуры. Кто сколько переплатил, кто не выставил счёт-фактуру — с одного взгляда.',
    en: 'Money paid ↔ invoices received. Who overpaid and who never issued an invoice — at a glance.',
  },
  'Тушган пул ↔ ёзилган фактура. Ким тўламаган, кимга фактура ёзилмаган — контрагент кесимида.': {
    ru: 'Поступления ↔ выставленные счета-фактуры. Кто не заплатил, кому не выставлен счёт — в разрезе контрагентов.',
    en: 'Money received ↔ invoices issued. Who has not paid and who was never invoiced — per counterparty.',
  },
  'Ҳисобингизга ТУШГАН пул ↔ сиз ЁЗГАН фактуралар. Банк кўчирмаси ва E-фактурадан юкланган «юборилган фактуралар» файлини бирга танланг.': {
    ru: 'Поступления на ваш счёт ↔ выставленные вами счета-фактуры. Выберите вместе банковскую выписку и файл «выставленные счета-фактуры» из Э-фактуры.',
    en: 'Money received on your account ↔ invoices you issued. Select the bank statement together with the “issued invoices” export from E-faktura.',
  },

  // ---------- Рўйхатдан ўтиш ва режалар ----------
  'Рўйхатдан ўтиш': { ru: 'Регистрация', en: 'Sign up' },
  'Бепул рўйхатдан ўтиш': { ru: 'Бесплатная регистрация', en: 'Sign up free' },
  'Бепул бошлаш': { ru: 'Начать бесплатно', en: 'Start free' },
  'Бепул: 3 та корхона, сверка чексиз': {
    ru: 'Бесплатно: 3 предприятия, сверок без ограничений',
    en: 'Free: 3 companies, unlimited reconciliations',
  },
  'Камида 6 та белги': { ru: 'Минимум 6 символов', en: 'At least 6 characters' },
  'Ҳисобингиз йўқми?': { ru: 'Нет аккаунта?', en: 'No account yet?' },
  'Аллақачон ҳисобингиз борми?': { ru: 'Уже есть аккаунт?', en: 'Already have an account?' },
  'Иш майдони аниқланмади. Тизимдан чиқиб, қайта киринг.': {
    ru: 'Рабочее пространство не определено. Выйдите и войдите снова.',
    en: 'Workspace could not be resolved. Sign out and sign in again.',
  },
  'Хатолик юз берди. Қайта уриниб кўринг.': {
    ru: 'Произошла ошибка. Попробуйте ещё раз.',
    en: 'Something went wrong. Please try again.',
  },

  'Қолдиқ тенгламаси': { ru: 'Уравнение остатка', en: 'Balance equation' },
  'бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ': { ru: 'остаток на начало + приход − расход = остаток на конец', en: 'opening balance + credit − debit = closing balance' },
  'файлда': { ru: 'в файле', en: 'in the file' },
  'файлда қолдиқ кўрсатилмаган': { ru: 'в файле остаток не указан', en: 'the file states no balance' },
  'файлда бир нечта ҳисоб қолдиғи бор': { ru: 'в файле остатки нескольких счетов', en: 'the file holds balances of several accounts' },
  'текшириб бўлмади': { ru: 'проверить не удалось', en: 'could not be verified' },
  'Ойма-ой тафсилотлар': { ru: 'Помесячная детализация', en: 'Month-by-month detail' },
  'корхоналар': { ru: 'предприятия', en: 'companies' },
  'коммунал/бюджет': { ru: 'коммунальные/бюджет', en: 'utilities / budget' },
  '(сиз белгилагансиз)': { ru: '(отмечено вами)', en: '(marked by you)' },
  'текширинг': { ru: 'проверьте', en: 'please check' },
  'Жами': { ru: 'Всего', en: 'Total' },
  'контрагент, шундан': { ru: 'контрагентов, из них у', en: 'counterparties, of which' },
  'тасида фарқ бор. Қуйидаги жадвалда': { ru: 'есть разница. В таблице ниже показаны', en: 'have a difference. The table below shows' },
  'кўрсатилмоқда, жадвал остидаги «Жами танланганлар» эса фақат ✓ белгиланганларни қўшади.': { ru: ', а строка «Итого по выбранным» под таблицей суммирует только отмеченные ✓.', en: ', while “Total for selected” under the table adds up only the ✓ rows.' },
  'та контрагент коммуналга ўхшайди (номи бўйича ёки бошқа корхоналар шундай белгилагани учун), лекин улар': { ru: 'контрагент(ов) похожи на коммунальные (по названию или потому что так отметили другие предприятия), но они', en: 'counterparties look like utilities (by name, or because other companies marked them so), but they are' },
  '— жадвалда «?» белгиси билан турибди. Текшириб, тоифасини ўзгартиринг. Тизим ўзи ҳеч қачон яшириб қўймайди.': { ru: '— в таблице они отмечены знаком «?». Проверьте и измените категорию. Система никогда не скрывает их сама.', en: '— they carry a “?” marker in the table. Check them and change the category. The system never hides them on its own.' },
  'Муваффақиятли сақланди!': { ru: 'Успешно сохранено!', en: 'Saved successfully.' },
  'ҳолатига': { ru: 'по состоянию на', en: 'as of' },
  '(йил бошидан)': { ru: '(с начала года)', en: '(year to date)' },

  // ---------- Кирим сверкаси саҳифаси ----------
  'Жами келган пул (кредит) ↔ биз юборган счёт-фактуралар. Банк кўчирмаси ва E-фактурадан юкланган «юборилган фактуралар» файлини бирга танланг.': { ru: 'Все поступления (кредит) ↔ выставленные нами счета-фактуры. Выберите вместе банковскую выписку и файл «выставленные счета-фактуры» из Э-Фактуры.', en: 'All money received (credit) ↔ the invoices we issued. Select the bank statement together with the “issued invoices” export from E-Faktura.' },
  'Ўз СТИР': { ru: 'Собственный ИНН', en: 'Own TIN' },
  'Жами келган пул (Кредит)': { ru: 'Всего поступлений (кредит)', en: 'Total money received (credit)' },
  'Жами юборилган счёт-фактура': { ru: 'Всего выставленных счетов-фактур', en: 'Total invoices issued' },
  'та банк ўтказмаси': { ru: 'банковских операций', en: 'bank transactions' },
  'та тасдиқланган фактура': { ru: 'подтверждённых счетов-фактур', en: 'confirmed invoices' },
  '(фақат «Тасдиқланган» фактуралар ҳисобланади)': { ru: '(учитываются только «Подтверждённые» счета-фактуры)', en: '(only “Confirmed” invoices are counted)' },
  'Excel юклаш (5 варақ)': { ru: 'Выгрузить в Excel (5 листов)', en: 'Export to Excel (5 sheets)' },
  'Excel юклаб олиш': { ru: 'Скачать Excel', en: 'Download Excel' },
  'Счет-ф': { ru: 'Счёт-ф.', en: 'Invoice' },
  'счет-ф': { ru: 'счёт-ф.', en: 'invoices' },
  'келган пул': { ru: 'поступления', en: 'money in' },
  'фарқи': { ru: 'разница', en: 'difference' },
  'кун': { ru: 'дн.', en: 'days' },
  'Банк ўтказмалари': { ru: 'Банковские операции', en: 'Bank transactions' },
  'Юборилган счёт-фактуралар': { ru: 'Выставленные счета-фактуры', en: 'Issued invoices' },
  'Акт': { latn: 'Akt', ru: 'Акт', en: 'Act' },
  'Акт сверки': { latn: 'Akt sverki', ru: 'Акт сверки', en: 'Reconciliation act' },
  'Ҳисоб санаси:': { ru: 'Дата расчёта:', en: 'As of:' },
  'Жами қарз:': { ru: 'Всего задолженность:', en: 'Total receivable:' },
  'Аванс:': { ru: 'Аванс:', en: 'Advance:' },
  'Қарз БИЗНИНГ фойдамизга — мижоз': { ru: 'Задолженность в НАШУ пользу — клиент не оплатил', en: 'Balance in OUR favour — the customer has not paid' },
  'сўм тўламаган.': { ru: 'сум.', en: 'UZS.' },
  'Қарз МИЖОЗ фойдасига —': { ru: 'Задолженность в пользу КЛИЕНТА —', en: 'Balance in the CUSTOMER’s favour —' },
  'сўм ортиқча тушган (аванс).': { ru: 'сум поступило сверх суммы (аванс).', en: 'UZS received in excess (advance).' },
  'Ҳисоблаш усули: келган пул энг эски фактурадан бошлаб ёпилади (FIFO). Ёпилмай қолган қолдиқ фактура санасидан ҳисоб санасигача ўтган кунга қараб гуруҳланади. Фактурадан ортиқча келган пул — аванс.': { ru: 'Метод расчёта: поступления закрывают счета-фактуры начиная с самой старой (FIFO). Незакрытый остаток группируется по числу дней от даты счёта-фактуры до даты расчёта. Поступления сверх счетов-фактур считаются авансом.', en: 'Method: payments close invoices oldest-first (FIFO). Whatever remains open is bucketed by the days between the invoice date and the calculation date. Money received above the invoiced amount counts as an advance.' },
  'Файлда фақат жадвалнинг ўзи бўлади: Дата · Документ · Дебет · Кредит — икки томонлама, Сальдо ва Обороты қаторлари билан.': { ru: 'Файл содержит только саму таблицу: Дата · Документ · Дебет · Кредит — двусторонняя, со строками «Сальдо» и «Обороты».', en: 'The file contains just the table itself: Date · Document · Debit · Credit — two-sided, with Balance and Turnover rows.' },

  // ---------- Кириш саҳифаси ----------
  'Кириш': { ru: 'Войти', en: 'Enter' },
  'Кириш фақат рухсат этилган фойдаланувчилар учун': { ru: 'Вход только для авторизованных пользователей', en: 'Access is limited to authorised users' },
  'Email манзил': { ru: 'Адрес email', en: 'Email address' },
  'Парол': { ru: 'Пароль', en: 'Password' },
  'Хавфсизлик текшируви...': { ru: 'Проверка безопасности...', en: 'Security check...' },

  // ---------- Корхоналар рўйхати ----------
  'Муҳити': { ru: 'среда', en: 'workspace' },
  'Янги Фирма Қўшиш': { ru: 'Добавить фирму', en: 'Add a company' },
  'Бекор қилиш': { ru: 'Отмена', en: 'Cancel' },
  'корхонасини ва унинг барча сверка ҳисоботларини бутунлай ўчириб ташламоқчимисиз?': { ru: 'удалить это предприятие и все его отчёты сверки безвозвратно?', en: 'delete this company and all of its reconciliation reports permanently?' },

  // ---------- Тез кунда ----------
  'Тез кунда': { ru: 'Скоро', en: 'Coming soon' },
  'Бош саҳифага қайтиш': { ru: 'Вернуться на главную', en: 'Back to the home page' },
  'Ушбу модул ҳозирда ишлаб чиқилмоқда ва тез орада ишга тушади. Ҳозирча': { ru: 'Этот модуль в разработке и скоро будет запущен. Пока что', en: 'This module is under development and will launch soon. For now' },
  'муҳитидан фойдаланишингиз мумкин.': { ru: 'вы можете пользоваться средой', en: 'you can use the workspace above.' },

  // ---------- Bosh sahifa ----------
  'Ички Бошқарув Тизими': { ru: 'Внутренняя система управления', en: 'Internal management system' },
  'Иш Муҳитини Танланг': { ru: 'Выберите рабочую среду', en: 'Choose a workspace' },
  'Ҳозирча Excel Smart-Audit модули фаол. Қолган модуллар тез орада ишга тушади.': { ru: 'Сейчас доступен модуль Excel Smart-Audit. Остальные модули будут запущены в ближайшее время.', en: 'The Excel Smart-Audit module is live. The remaining modules launch soon.' },
  'Банк чиқимлари ва келган счёт-фактураларни автоматик солиштириш, фарқларни аниқлаш муҳити.': { ru: 'Среда автоматического сопоставления банковских расходов и полученных счетов-фактур с выявлением расхождений.', en: 'A workspace that matches bank payments against received invoices and surfaces the differences.' },
  'Кирим Сверкаси': { latn: 'Kirim Sverkasi', ru: 'Сверка поступлений', en: 'Incoming reconciliation' },
  'Жами келган пул (кредит) ва биз юборган счёт-фактураларни контрагент кесимида солиштириш.': { ru: 'Сопоставление всех поступлений (кредит) с выставленными нами счетами-фактурами в разрезе контрагентов.', en: 'Matches all money received (credit) against the invoices we issued, counterparty by counterparty.' },

  'Бухгалтерия Хизматлари Маркази': { ru: 'Центр бухгалтерских услуг', en: 'Accounting Services Centre' },
  'Бухгалтерия Хизматлари Маркази | Ички Тизим': { ru: 'Центр бухгалтерских услуг | Внутренняя система', en: 'Accounting Services Centre | Internal System' },
  'Интеллектуал бошқарув ва автоматик аудит тизими. Барча ҳаракатлар назорат остида.': { ru: 'Система интеллектуального управления и автоматического аудита. Все действия под контролем.', en: 'Intelligent management and automated audit system. Every action is tracked.' },
  'Пул маблағлари ва счёт-фактуралар фарқи таҳлили': { ru: 'Анализ расхождений между денежными средствами и счетами-фактурами', en: 'Analysis of differences between cash movements and invoices' },
  'Виртуал Омбор (Астатка)': { latn: 'Virtual Ombor (Astatka)', ru: 'Виртуальный склад (остатки)', en: 'Virtual warehouse (stock)' },
  'МХИК (ИКПУ) кодлари бўйича товар қолдиқларини автоматик ҳисоблаш тизими.': { ru: 'Система автоматического расчёта товарных остатков по кодам ИКПУ.', en: 'Automatic stock-balance calculation by IKPU product codes.' },
  'AI Таҳлил ва Прогноз': { ru: 'AI-анализ и прогноз', en: 'AI analysis and forecasting' },
  'Сунъий интеллект ёрдамида солиқ хавфларини башорат қилиш ва автоматик баланс тузиш.': { ru: 'Прогнозирование налоговых рисков и автоматическое составление баланса с помощью искусственного интеллекта.', en: 'Predicting tax risks and building the balance sheet automatically with AI.' },

  // ============================================================
  // 2026-08-16/17 — ОЧИҚ САЙТ ВА ЯНГИ МАРШРУТЛАР
  // ------------------------------------------------------------
  // Тил манзилга чиққанда рус ва инглиз тиллари ҲАҚИҚАТАН
  // ишлаши шарт. Ўлчов: аввал 410 та UI матндан 210 таси
  // таржимасиз эди (48,8%), яъни рус тилида саҳифанинг ярми
  // ўзбекча кўринарди.
  // ============================================================

  // ---------- Навигация ва умумий ----------
  'Бош саҳифа': { ru: 'Главная', en: 'Home' },
  'Орқага': { ru: 'Назад', en: 'Back' },
  'Қўлланма': { ru: 'Руководство', en: 'Guide' },
  'Тўлиқ қўлланма': { ru: 'Полное руководство', en: 'Full guide' },
  'Нима бор': { ru: 'Возможности', en: 'Features' },
  'Нарх': { ru: 'Цены', en: 'Pricing' },
  'Қандай ишлайди': { ru: 'Как это работает', en: 'How it works' },
  'Иш столи': { ru: 'Рабочий стол', en: 'Dashboard' },
  'Иш столига ўтиш': { ru: 'Перейти в рабочий стол', en: 'Go to dashboard' },
  'Мижозлар': { ru: 'Клиенты', en: 'Clients' },
  'Корхоналар': { ru: 'Организации', en: 'Companies' },
  'Ўзбекистон': { ru: 'Узбекистан', en: 'Uzbekistan' },
  'Фильтр': { ru: 'Фильтр', en: 'Filter' },
  'Барчасини белгилаш': { ru: 'Отметить все', en: 'Select all' },
  'Яна': { ru: 'Ещё', en: 'Another' },
  'та имконият': { ru: 'возможностей', en: 'features' },

  // ---------- Бренд ва шиор ----------
  'Бухгалтер учун автоматик текширув тизими': { ru: 'Автоматическая проверка для бухгалтера', en: 'Automated verification for accountants' },
  'Банк кўчирмаси билан фактура рўйхатини юкланг — тизим ҳар бир контрагент бўйича рақамларни солиштиради ва фарқ борларини ажратиб беради.': { ru: 'Загрузите выписку банка и реестр счетов-фактур — система сверит суммы по каждому контрагенту и покажет, где расхождение.', en: 'Upload a bank statement and an invoice register — the system compares the amounts for every counterparty and shows where they disagree.' },
  'Корхона товар-моддий бойликларини олиш учун юборилган пул маблағларини ҳамда келган маҳсулотлар ҳисоб-варақаларини тез аниқлаш солиштирмаси': { ru: 'Сопоставление денежных средств, перечисленных за товарно-материальные ценности, с полученными счетами-фактурами для быстрого выявления расхождений', en: 'A comparison of funds paid for goods and materials against the invoices received, for fast detection of discrepancies' },
  'Ўзбекистондаги бухгалтерлар учун': { ru: 'Для бухгалтеров Узбекистана', en: 'For accountants in Uzbekistan' },
  'Қўлда бир неча кун кетадиган иш бир неча сонияда.': { ru: 'Работа, на которую вручную уходят дни, — за несколько секунд.', en: 'Work that takes days by hand — done in seconds.' },
  'Карта сўралмайди. Бепул режада 3 та корхона, сверка чексиз.': { ru: 'Карта не нужна. На бесплатном тарифе — 3 организации, сверок без ограничений.', en: 'No card required. Free plan: 3 companies, unlimited reconciliations.' },
  '1,37 млрд': { latn: '1,37 mlrd', ru: '1,37 млрд', en: '1.37 bn' },
  'сўм айланмада синовдан ўтган': { ru: 'сум оборота проверено на реальных данных', en: 'UZS of turnover tested on real data' },
  'та автомат текширув, ҳар ўзгаришдан кейин': { ru: 'автоматических проверок после каждого изменения', en: 'automated checks after every change' },
  'та ҳақиқий банк файли — эталон тўплам': { ru: 'реальных банковских файла — эталонный набор', en: 'real bank files — the reference set' },

  // ---------- Қўлда / тизимда ----------
  'Ойлик сверка — икки хил кун': { ru: 'Месячная сверка — два разных дня', en: 'Monthly reconciliation — two very different days' },
  'Ҳақиқий синовда: 1,37 млрд сўм айланма, 152 ўтказма, 159 фактура, 35 контрагент.': { ru: 'На реальных данных: оборот 1,37 млрд сум, 152 платежа, 159 счетов-фактур, 35 контрагентов.', en: 'On real data: 1.37 bn UZS turnover, 152 payments, 159 invoices, 35 counterparties.' },
  'Қўлда': { ru: 'Вручную', en: 'By hand' },
  'бир неча кун': { ru: 'несколько дней', en: 'several days' },
  'бир неча сония': { ru: 'несколько секунд', en: 'a few seconds' },
  'Иккита Excel\'ни ёнма-ён очиб, кўз билан солиштириш': { ru: 'Открыть два Excel рядом и сверять глазами', en: 'Open two spreadsheets side by side and compare by eye' },
  'Битта контрагент бир нечта ном билан ёзилган — қўлда бирлаштириш': { ru: 'Один контрагент записан под разными названиями — объединять вручную', en: 'One counterparty written under several names — merge them manually' },
  'Коммунал ва бюджет тўловлари орасида адашиш': { ru: 'Путаться среди коммунальных и бюджетных платежей', en: 'Get lost among utility and budget payments' },
  'Хато топилса — ҳаммасини бошидан': { ru: 'Нашли ошибку — начинать всё заново', en: 'Find one error — start over from the beginning' },
  'Файлларни ўз ҳолича юклаш — банк форматини ўзгартириш шарт эмас': { ru: 'Загрузить файлы как есть — формат банка менять не нужно', en: 'Upload the files as they are — no need to reformat the bank export' },
  'Контрагент СТИР бўйича ўзи бирлаштирилади': { ru: 'Контрагенты объединяются автоматически по ИНН', en: 'Counterparties are merged automatically by tax ID' },
  'Коммунал/бюджет алоҳида тоифага ажралади, ЖАМИ эса тўлиқ қолади': { ru: 'Коммунальные и бюджетные платежи выделяются отдельно, ИТОГО остаётся полным', en: 'Utilities and budget payments move to their own category; the TOTAL stays complete' },
  'Фарқ бор қаторлар рангда ажралиб туради': { ru: 'Строки с расхождением выделены цветом', en: 'Rows with a difference stand out in colour' },

  // ---------- Имкониятлар ----------
  'Ҳар бири ҳақиқий файлда чиққан муаммодан келиб чиққан — рўйхат тўлдириш учун эмас.': { ru: 'Каждая появилась из реальной проблемы в реальном файле — а не для длины списка.', en: 'Each one came from a real problem in a real file — not to pad a list.' },
  'Ҳар бир имконият ҳақиқий банк файлида чиққан муаммодан келиб чиққан — рўйхат тўлдириш учун эмас.': { ru: 'Каждая возможность появилась из реальной проблемы в банковском файле — а не для длины списка.', en: 'Every feature came from a real problem in a real bank file — not to pad a list.' },
  'Бошланғич қолдиқ + кирим − чиқим = охирги қолдиқ. Дебет билан кредит алмашиб кетса файлнинг «Итого» қатори буни СЕЗМАЙДИ — бу тенглама сезади ва айтади.': { ru: 'Начальное сальдо + приход − расход = конечное сальдо. Если дебет и кредит перепутаны местами, строка «Итого» этого НЕ ЗАМЕТИТ — а равенство заметит и скажет.', en: 'Opening balance + credits − debits = closing balance. If debit and credit are swapped, the file\'s own total will NOT notice — this equation will, and it says so.' },
  'Формат хотираси': { ru: 'Память форматов', en: 'Format memory' },
  'Нотаниш банк шакли келса, тизим уни ўрганиб олади ва кейинги сафар ўзи танийди. Хотира умумий — ҳар янги фойдаланувчи ҳамма учун тизимни кучайтиради.': { ru: 'Незнакомый формат банка система запоминает и в следующий раз распознаёт сама. Память общая — каждый новый пользователь усиливает систему для всех.', en: 'An unfamiliar bank layout is learned once and recognised automatically next time. The memory is shared — every new user makes the system stronger for everyone.' },
  'Коммунал ва бюджет ажралади': { ru: 'Коммунальные и бюджетные — отдельно', en: 'Utilities and budget split out' },
  'Улар асосий жадвални чалғитмайди, лекин ҲЕЧ ҚАЧОН ўчирилмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ сумма бўлиб қолади.': { ru: 'Они не мешают основной таблице, но НИКОГДА не удаляются — «ИТОГО» наверху всегда остаётся полной суммой.', en: 'They stop cluttering the main table but are NEVER removed — the TOTAL at the top always stays the full amount.' },
  'Битта контрагент учун расмий икки томонлама ҳужжат: Дата · Документ · Дебет · Кредит, Сальдо ва Обороты қаторлари билан. Excel\'да, босишга тайёр.': { ru: 'Официальный двусторонний документ по одному контрагенту: Дата · Документ · Дебет · Кредит, со строками Сальдо и Обороты. В Excel, готов к печати.', en: 'The official two-sided document for a single counterparty: date, document, debit, credit, with balance and turnover rows. In Excel, ready to print.' },
  'Қарздорлик ёши': { ru: 'Задолженность по срокам', en: 'Receivables ageing' },
  'Тўланмаган фактура қолдиғи 0–30 / 31–60 / 61–90 / 90+ кун бўйича ажратилади. Ҳисоб FIFO: келган пул энг эски фактурадан бошлаб ёпилади.': { ru: 'Остаток неоплаченных счетов разбивается по срокам 0–30 / 31–60 / 61–90 / 90+ дней. Расчёт по FIFO: поступившие деньги закрывают самые старые счета первыми.', en: 'The unpaid invoice balance is split into 0–30 / 31–60 / 61–90 / 90+ days. FIFO: incoming money closes the oldest invoices first.' },
  'Беш варақли Excel ҳисобот': { ru: 'Отчёт Excel на пяти листах', en: 'Five-sheet Excel report' },
  'Сверка · Йиллар · Ойма-ой · Тўловлар · Фактуралар. Экранда нима кўринса, файлда ҳам ўша.': { ru: 'Сверка · Годы · По месяцам · Платежи · Счета-фактуры. Что видно на экране — то же и в файле.', en: 'Reconciliation · Years · Monthly · Payments · Invoices. What you see on screen is what lands in the file.' },
  'Ўз иш майдонингиз': { ru: 'Собственное рабочее пространство', en: 'Your own workspace' },
  'Бошқа фойдаланувчи сизнинг корхоналарингизни ҳам, суммаларингизни ҳам кўрмайди. Ҳар ҳисоб ўз майдонида.': { ru: 'Другой пользователь не увидит ни ваши организации, ни ваши суммы. Каждый аккаунт — в своём пространстве.', en: 'No other user sees your companies or your amounts. Every account lives in its own space.' },
  'Рақам ўзгартирилмайди': { ru: 'Цифры не подменяются', en: 'Numbers are never altered' },
  'Тизим фақат файлда нима ёзилганини ўқийди ва фарқни кўрсатади. «Тўғрилаш» учун қўлда тузатма қўшилмайди — тўғрилаш сизнинг қарорингиз.': { ru: 'Система читает только то, что записано в файле, и показывает расхождение. Никаких ручных «поправок» ради красивой цифры — исправление остаётся вашим решением.', en: 'The system reads only what the file says and shows the difference. No manual "corrections" are ever added — fixing it stays your decision.' },

  // ---------- Нарх ----------
  'Чеклов сверка сонига эмас, КОРХОНА сонига. Сверкани қанча хоҳласангиз шунча марта қайта юкласангиз бўлади.': { ru: 'Ограничение не на количество сверок, а на количество ОРГАНИЗАЦИЙ. Сверку можно перезапускать сколько угодно раз.', en: 'The limit is on COMPANIES, not on reconciliations. You can re-run a reconciliation as many times as you like.' },
  'Бепул': { ru: 'Бесплатно', en: 'Free' },
  'Бухгалтер': { ru: 'Бухгалтер', en: 'Accountant' },
  'Бюро': { ru: 'Бюро', en: 'Bureau' },
  'сўм/ой': { ru: 'сум/мес', en: 'UZS/mo' },
  'Кўпчиликка мос': { ru: 'Выбор большинства', en: 'Most popular' },
  'Синаб кўриш учун': { ru: 'Чтобы попробовать', en: 'To try it out' },
  'Мижозлари бор бухгалтер учун': { ru: 'Для бухгалтера с клиентами', en: 'For an accountant with clients' },
  'Жамоа билан ишлайдиган бюро учун': { ru: 'Для бюро, работающего командой', en: 'For a bureau working as a team' },
  '3 та корхона': { ru: '3 организации', en: '3 companies' },
  'Корхона чексиз': { ru: 'Организаций без ограничений', en: 'Unlimited companies' },
  '1 фойдаланувчи': { ru: '1 пользователь', en: '1 user' },
  '5 фойдаланувчи': { ru: '5 пользователей', en: '5 users' },
  'Сверка чексиз': { ru: 'Сверок без ограничений', en: 'Unlimited reconciliations' },
  'Барча ҳисоботлар': { ru: 'Все отчёты', en: 'All reports' },
  'Умумий иш майдони': { ru: 'Общее рабочее пространство', en: 'Shared workspace' },
  'Ҳозирча тўлов қабул қилинмайди — ҳамма ҳисоб бепул режада ишлайди. Пулли режа керак бўлса, ёзиб қолдиринг: ким сўраганини биламиз ва аввал ўшаларга очамиз.': { ru: 'Оплата пока не подключена — все аккаунты работают на бесплатном тарифе. Нужен платный — оставьте заявку: мы знаем, кто просил, и откроем им первыми.', en: 'Payment is not connected yet — every account runs on the free plan. If you need a paid one, leave a request: we know who asked and will open it for them first.' },
  'Нарх бўйича саволлар': { ru: 'Вопросы о ценах', en: 'Pricing questions' },
  'Нега чеклов сверка сонига эмас, корхона сонига?': { ru: 'Почему ограничение на организации, а не на количество сверок?', en: 'Why is the limit on companies rather than on reconciliations?' },
  'Буxгалтер сверкани бир марта қилмайди: юклайди, фарқ кўради, файлни тўғрилайди, қайта юклайди. Сверка саноғи айнан ишонч туғилаётган лаҳзада урарди. Корхона сони эса буxгалтернинг ўз даромадига боғлиқ — у ўсганда биз ҳам ўсамиз.': { ru: 'Бухгалтер не делает сверку один раз: загрузил, увидел расхождение, поправил файл, загрузил снова. Счётчик сверок бил бы именно в тот момент, когда появляется доверие. А число организаций связано с доходом самого бухгалтера — он растёт, растём и мы.', en: 'An accountant does not reconcile once: upload, spot a difference, fix the file, upload again. A reconciliation counter would hit exactly when trust is forming. Company count, on the other hand, tracks the accountant\'s own income — when they grow, we grow.' },
  'Бепул режада нима чекланган?': { ru: 'Что ограничено на бесплатном тарифе?', en: 'What is limited on the free plan?' },
  'Фақат корхона сони — 3 та. Сверка, ҳисобот, Акт сверки, Excel экспорт — ҳаммаси чексиз ва тўлиқ ишлайди. Бепул режа «намойиш» эмас, ишчи режа.': { ru: 'Только количество организаций — 3. Сверка, отчёты, акт сверки, выгрузка в Excel — всё без ограничений и в полном объёме. Бесплатный тариф — это не «демо», а рабочий режим.', en: 'Only the number of companies — three. Reconciliation, reports, the reconciliation act and Excel export all work fully and without limits. The free plan is a working plan, not a demo.' },
  'Ҳозир тўлаш мумкинми?': { ru: 'Можно ли уже оплатить?', en: 'Can I pay already?' },
  'Йўқ. Тўлов тизими ҳали уланмаган — ҳамма ҳисоб бепул режада ишлайди. Пулли режа керак бўлса ёзиб қолдиринг: ким сўраганини биламиз ва аввал ўшаларга очамиз.': { ru: 'Нет. Платёжная система пока не подключена — все аккаунты на бесплатном тарифе. Нужен платный — оставьте заявку: мы откроем его вам первыми.', en: 'No. Payments are not connected yet — every account is on the free plan. If you need a paid one, leave a request and we will open it for you first.' },
  'Йиллик тўлов борми?': { ru: 'Есть ли годовая оплата?', en: 'Is there annual billing?' },
  'Режалаштирилган: йиллик тўловда 2 ой бепул. Тўлов уланганда очилади.': { ru: 'Запланировано: при годовой оплате 2 месяца бесплатно. Откроется вместе с подключением оплаты.', en: 'Planned: two months free on annual billing. It opens when payments go live.' },
  'Нарх нимага асосланган?': { ru: 'На чём основана цена?', en: 'How was the price set?' },
  'Тажрибали буxгалтердан сўралган. Дастлаб 149 000 сўм тахмин қилинган эди, лекин у бозордан эмас, ҳисобдан чиққан рақам эди. Бозордан келган далил тахминдан устун — шунинг учун нарх алмаштирилди.': { ru: 'Спросили у опытного бухгалтера. Сначала предполагали 149 000 сум, но это была цифра из расчёта, а не с рынка. Довод с рынка сильнее предположения — поэтому цену заменили.', en: 'We asked an experienced accountant. The first guess was 149,000 UZS, but that came from a spreadsheet, not from the market. Market evidence beats a guess — so the price changed.' },

  // ---------- Йўл харитаси ----------
  'Кейин нима бўлади': { ru: 'Что будет дальше', en: 'What comes next' },
  'Булар ҳали ЙЎҚ. Ваъда сифатида эмас, йўналиш сифатида ёзилган.': { ru: 'Этого пока НЕТ. Написано как направление, а не как обещание.', en: 'None of this exists yet. It is written as a direction, not as a promise.' },
  'AI таҳлил ва прогноз': { ru: 'AI-анализ и прогноз', en: 'AI analysis and forecasting' },
  'Солиқ хавфларини олдиндан кўрсатиш ва автоматик баланс тузиш.': { ru: 'Заблаговременный показ налоговых рисков и автоматическое составление баланса.', en: 'Flagging tax risks in advance and building the balance sheet automatically.' },
  'МХИК (ИКПУ) кодлари бўйича товар қолдиқларини автоматик ҳисоблаш.': { ru: 'Автоматический расчёт товарных остатков по кодам ИКПУ.', en: 'Automatic stock-balance calculation by IKPU product codes.' },
  'Тўғридан-тўғри уланиш': { ru: 'Прямое подключение', en: 'Direct connection' },
  'Excel ўрнига банк ва Э-фактура билан бевосита алоқа (1C «Клиент-Банк», camt.053).': { ru: 'Прямая связь с банком и Э-фактурой вместо Excel (1С «Клиент-Банк», camt.053).', en: 'A direct link to the bank and e-invoicing instead of Excel (1C Client-Bank, camt.053).' },

  // ---------- Қўлланма: уч қадам ----------
  'Бу тизим нима қилади': { ru: 'Что делает эта система', en: 'What this system does' },
  'Банк кўчирмангизни ва фактура рўйхатини юкласангиз, тизим ҳар бир контрагент бўйича пул билан фактурани солиштиради ва ФАРҚ борларини ажратиб беради. Қўлда бир неча кун кетадиган иш — бир неча сонияда.': { ru: 'Загрузите выписку банка и реестр счетов-фактур — система сверит деньги со счетами по каждому контрагенту и выделит тех, у кого есть РАСХОЖДЕНИЕ. Работа, на которую вручную уходят дни, — за несколько секунд.', en: 'Upload your bank statement and invoice register: the system matches money against invoices for every counterparty and singles out those with a DIFFERENCE. Work that takes days by hand — done in seconds.' },
  'Уч қадамда': { ru: 'В три шага', en: 'In three steps' },
  'Файлларни юкланг': { ru: 'Загрузите файлы', en: 'Upload the files' },
  'Иккита файл керак: банкдан олинган кўчирма ва Э-фактурадан юкланган фактуралар рўйхати. Иккаласини бирга танласангиз ҳам бўлади.': { ru: 'Нужны два файла: выписка из банка и реестр счетов-фактур из Э-фактуры. Можно выбрать оба сразу.', en: 'Two files are needed: the bank statement and the invoice register exported from e-invoicing. You can select both at once.' },
  'Форматлар: .xls, .xlsx, .csv. Банкнинг ўз файлини ўзгартирмасдан, қандай бўлса шундай юкланг.': { ru: 'Форматы: .xls, .xlsx, .csv. Загружайте файл банка как есть, ничего в нём не меняя.', en: 'Formats: .xls, .xlsx, .csv. Upload the bank\'s own file as it is, without editing it.' },
  'Тизим нимани ўқиганини кўрсатади': { ru: 'Система показывает, что именно прочитала', en: 'The system shows exactly what it read' },
  'Юклангандан кейин биринчи кўринадиган нарса — натижа эмас, ТЕКШИРУВ: қайси файлдан қайси варақ, нечта қатор ўқилди ва файлнинг ўз якуни билан мос келдими.': { ru: 'После загрузки первым появляется не результат, а ПРОВЕРКА: из какого файла какой лист, сколько строк прочитано и сошлось ли это с итогом самого файла.', en: 'After the upload the first thing you see is not the result but the CHECK: which sheet from which file, how many rows were read, and whether that matches the file\'s own total.' },
  'Қолдиқ тенгламаси файлнинг ўзини текширади: бошланғич қолдиқ + кирим − чиқим охирги қолдиққа тенг чиқмаса, тизим буни АЙТАДИ ва натижани жимгина кўрсатавермайди.': { ru: 'Балансовое равенство проверяет сам файл: если начальное сальдо + приход − расход не сходится с конечным сальдо, система СКАЖЕТ об этом, а не покажет результат молча.', en: 'The balance equation validates the file itself: if opening balance + credits − debits does not equal the closing balance, the system SAYS SO instead of quietly showing a result.' },
  'Фарқни кўринг': { ru: 'Посмотрите расхождение', en: 'See the difference' },
  'Жадвалда ҳар бир контрагент бўйича: қанча пул ўтган, қанча фактура бор ва орадаги фарқ. Охирги устун нима қилиш кераклигини сўз билан ёзади.': { ru: 'В таблице по каждому контрагенту: сколько прошло денег, на какую сумму есть счета-фактуры и разница между ними. Последний столбец словами говорит, что нужно сделать.', en: 'The table shows, per counterparty: how much money moved, how much is invoiced, and the difference. The last column spells out in words what to do about it.' },
  'Натижани Excel\'га юклаб олиш ва битта контрагент учун Акт сверки тайёрлаш мумкин.': { ru: 'Результат можно выгрузить в Excel и подготовить акт сверки по отдельному контрагенту.', en: 'The result can be exported to Excel, and a reconciliation act can be prepared for a single counterparty.' },
  'файлларни шу ерга': { ru: 'файлы — сюда', en: 'files go here' },
  'файл ўзини текширди': { ru: 'файл проверил сам себя', en: 'the file checked itself' },
  'жавоб шу устунда': { ru: 'ответ — в этом столбце', en: 'the answer is in this column' },
  'қатор': { ru: 'строк', en: 'rows' },

  // ---------- Иккита йўналиш ва ранг калити ----------
  'Иккита сверка — иккита савол': { ru: 'Две сверки — два вопроса', en: 'Two reconciliations — two questions' },
  'Иккаласи ҳам битта корхона учун, лекин пулнинг йўналиши бошқа. Аралаштириб юбормаслик учун ҳар бирининг ўз ранги бор.': { ru: 'Обе — для одной организации, но направление денег разное. Чтобы не путать, у каждой свой цвет.', en: 'Both belong to the same company, but the money flows the other way. Each has its own colour so they never get mixed up.' },
  'Чиқим сверкаси': { ru: 'Сверка расходов', en: 'Outgoing reconciliation' },
  'Кирим сверкаси': { ru: 'Сверка поступлений', en: 'Incoming reconciliation' },
  'Тўланган пул ↔ Келган фактура': { ru: 'Уплаченные деньги ↔ Полученные счета-фактуры', en: 'Money paid ↔ Invoices received' },
  'Тушган пул ↔ Ёзилган фактура': { ru: 'Поступившие деньги ↔ Выставленные счета-фактуры', en: 'Money received ↔ Invoices issued' },
  'Тушган пул ↔ ёзилган фактура: фарқни топади': { ru: 'Поступившие деньги ↔ выставленные счета-фактуры: находит расхождение', en: 'Money received ↔ invoices issued: finds the difference' },
  'Сиз пул тўладингиз. Етказиб берувчи фактура ёзиб бердими? Ким фактура бермаган — шу ерда кўринади.': { ru: 'Вы заплатили. Выставил ли поставщик счёт-фактуру? Кто не выставил — видно здесь.', en: 'You paid. Did the supplier issue an invoice? Whoever did not shows up here.' },
  'Сизга пул тушди. Сиз фактура ёзиб бердингизми? Ким тўламаган — шу ерда кўринади.': { ru: 'Вам поступили деньги. Выставили ли вы счёт-фактуру? Кто не заплатил — видно здесь.', en: 'Money came in. Did you issue an invoice? Whoever has not paid shows up here.' },
  'Тўланган / тушган пул': { ru: 'Уплаченные / поступившие деньги', en: 'Money paid / received' },
  'Келган / ёзилган фактура': { ru: 'Полученные / выставленные счета-фактуры', en: 'Invoices received / issued' },
  'банк кўчирмасидан': { ru: 'из выписки банка', en: 'from the bank statement' },
  'Э-фактурадан': { ru: 'из Э-фактуры', en: 'from e-invoicing' },
  'Фарқ бор — иш қилиш керак': { ru: 'Есть расхождение — нужно действие', en: 'There is a difference — action needed' },
  'фактура сўраш ёки ёзиш': { ru: 'запросить или выставить счёт-фактуру', en: 'request or issue an invoice' },
  'Қарз': { ru: 'Долг', en: 'Debt' },
  'пул ёки фактура етишмайди': { ru: 'не хватает денег или счёта-фактуры', en: 'money or an invoice is missing' },

  // ---------- Синовда нима топилди ----------
  'Синовда нима топилди': { ru: 'Что нашлось на реальных данных', en: 'What the test found' },
  'Ҳақиқий 7 ойлик маълумотда — 1,37 млрд сўм айланма, 152 ўтказма, 159 фактура, 35 контрагент. Тизим бухгалтер ЎТКАЗИБ ЮБОРГАН фарқларни топди:': { ru: 'На реальных данных за 7 месяцев — оборот 1,37 млрд сум, 152 платежа, 159 счетов-фактур, 35 контрагентов. Система нашла расхождения, которые бухгалтер ПРОПУСТИЛ:', en: 'On seven months of real data — 1.37 bn UZS turnover, 152 payments, 159 invoices, 35 counterparties. The system found differences the accountant had MISSED:' },
  'фактура бор, тўлов йўқ': { ru: 'счёт-фактура есть, оплаты нет', en: 'invoice present, no payment' },
  'Ўзбекистон почтаси': { ru: 'Почта Узбекистана', en: 'Uzbekistan Post' },
  'фарқ 28%': { ru: 'расхождение 28%', en: '28% difference' },

  // ---------- Анимация ----------
  'сверка': { ru: 'сверка', en: 'match' },
  'фарқ': { ru: 'разница', en: 'difference' },
  '3 контрагентдан': { ru: 'Из 3 контрагентов', en: 'Of 3 counterparties' },
  'тасида фарқ': { ru: 'с расхождением', en: 'has a difference' },
  'сўм': { ru: 'сум', en: 'UZS' },
  'Тизим тўланган пул билан келган фактурани контрагент кесимида солиштиради ва фарқ борларини ажратиб кўрсатади.': { ru: 'Система сверяет уплаченные деньги с полученными счетами-фактурами в разрезе контрагентов и выделяет тех, у кого есть расхождение.', en: 'The system matches money paid against invoices received, counterparty by counterparty, and singles out those with a difference.' },

  // ---------- ТСС ----------
  'Тез-тез сўраладиган саволлар': { ru: 'Частые вопросы', en: 'Frequently asked questions' },
  'Тизим рақамни ўзи тузатиб қўядими?': { ru: 'Система сама исправляет цифры?', en: 'Does the system correct numbers by itself?' },
  'Йўқ. Ҳеч қачон. Тизим фақат файлда нима ёзилганини ўқийди ва фарқни кўрсатади. Тўғрилаш — сизнинг қарорингиз.': { ru: 'Нет. Никогда. Система читает только то, что записано в файле, и показывает расхождение. Исправление — ваше решение.', en: 'No. Never. It reads only what the file says and shows the difference. Fixing it is your decision.' },
  'Қайси банкларнинг файллари ўқилади?': { ru: 'Файлы каких банков читаются?', en: 'Which banks\' files can it read?' },
  'Ҳозир танийдиган шакллар: Hamkorbank, Ipoteka / ASBT ва бир нечта умумий кўринишлар. Нотаниш шакл келса, тизим уни ўрганиб олади ва кейинги сафар ўзи танийди.': { ru: 'Сейчас распознаются: Hamkorbank, Ipoteka / ASBT и несколько общих форматов. Незнакомый формат система запоминает и в следующий раз распознаёт сама.', en: 'Currently recognised: Hamkorbank, Ipoteka / ASBT and several generic layouts. An unfamiliar layout is learned once and recognised automatically next time.' },
  'Файлларим кимга кўринади?': { ru: 'Кому видны мои файлы?', en: 'Who can see my files?' },
  'Фақат сизга. Ҳар бир ҳисоб ўз иш майдонида ишлайди — бошқа фойдаланувчи сизнинг корхоналарингизни ҳам, суммаларингизни ҳам кўрмайди.': { ru: 'Только вам. Каждый аккаунт работает в своём пространстве — другой пользователь не увидит ни ваши организации, ни ваши суммы.', en: 'Only you. Every account runs in its own workspace — no other user sees your companies or your amounts.' },
  'Пулими?': { ru: 'Это платно?', en: 'Does it cost money?' },
  'Бепул режада 3 та корхона. Сверканинг ўзи чексиз — қанча хоҳласангиз шунча марта қайта юкласангиз бўлади.': { ru: 'На бесплатном тарифе — 3 организации. Сама сверка без ограничений: перезагружать можно сколько угодно раз.', en: 'The free plan covers 3 companies. Reconciliation itself is unlimited — re-upload as many times as you like.' },
  'Коммунал ва солиқ тўловлари сверкани чалғитмайдими?': { ru: 'Не мешают ли сверке коммунальные и налоговые платежи?', en: 'Do utility and tax payments get in the way?' },
  'Улар алоҳида тоифага ажратилади ва асосий жадвалдан олиб турилади. Лекин ҲЕЧ ҚАЧОН ўчирилмайди — тепадаги «ЖАМИ» ҳар доим тўлиқ сумма бўлиб қолади.': { ru: 'Они выносятся в отдельную категорию и убираются из основной таблицы. Но НИКОГДА не удаляются — «ИТОГО» наверху всегда остаётся полной суммой.', en: 'They move into their own category and out of the main table. But they are NEVER deleted — the TOTAL at the top always stays the full amount.' },
  'Қандай файл форматлари қабул қилинади?': { ru: 'Какие форматы файлов принимаются?', en: 'Which file formats are accepted?' },
  'Excel (.xls, .xlsx) ва CSV. Банкнинг ўз файлини ўзгартирмасдан, қандай бўлса шундай юкласангиз бўлади.': { ru: 'Excel (.xls, .xlsx) и CSV. Файл банка можно загружать как есть, ничего в нём не меняя.', en: 'Excel (.xls, .xlsx) and CSV. You can upload the bank\'s own file as it is, without editing it.' },
  'Акт сверки тайёрлаб бера оладими?': { ru: 'Может ли он подготовить акт сверки?', en: 'Can it prepare a reconciliation act?' },
  'Ҳа. Битта контрагент учун расмий икки томонлама далолатнома тузилади: Дата, Документ, Дебет, Кредит устунлари ва Сальдо билан. Excel файл бўлиб юкланади.': { ru: 'Да. По одному контрагенту формируется официальный двусторонний акт: столбцы Дата, Документ, Дебет, Кредит и строка Сальдо. Выгружается файлом Excel.', en: 'Yes. For a single counterparty it builds the official two-sided act: date, document, debit and credit columns plus the balance row. It downloads as an Excel file.' },
  'Маълумотларим қаерда сақланади?': { ru: 'Где хранятся мои данные?', en: 'Where is my data stored?' },
  'Юкланган файлнинг ўзи сақланмайди — у фақат ўқилади. Сиз «Сақлаш» тугмасини боссангиз, натижа жадвали ўз иш майдонингизда сақланади.': { ru: 'Сам загруженный файл не сохраняется — он только читается. Если вы нажмёте «Сохранить», в вашем рабочем пространстве останется таблица результата.', en: 'The uploaded file itself is not stored — it is only read. If you press Save, the result table is kept in your own workspace.' },

  // ---------- Мижозлар саҳифаси ----------
  'Мижозни танланг — ичида чиқим ва кирим сверкаси ёнма-ён туради.': { ru: 'Выберите клиента — внутри сверка расходов и поступлений рядом.', en: 'Pick a client — inside, the outgoing and incoming reconciliations sit side by side.' },
  'Корхона қўшиш': { ru: 'Добавить организацию', en: 'Add a company' },
  'Корхоналар юкланмоқда...': { ru: 'Загрузка организаций...', en: 'Loading companies...' },
  'Корхона юкланмоқда...': { ru: 'Загрузка организации...', en: 'Loading company...' },
  'Корхона топилмади': { ru: 'Организация не найдена', en: 'Company not found' },
  'Бу корхона ўчирилган ёки сизнинг иш майдонингизга тегишли эмас.': { ru: 'Эта организация удалена или не относится к вашему рабочему пространству.', en: 'This company was deleted or does not belong to your workspace.' },
  'Рўйхатга қайтинг ва корхонани қайтадан танланг.': { ru: 'Вернитесь к списку и выберите организацию заново.', en: 'Go back to the list and pick the company again.' },
  'Ўчириб бўлмади, қайта уриниб кўринг.': { ru: 'Удалить не удалось, попробуйте ещё раз.', en: 'Could not delete, please try again.' },
  'тўланган пул − келган фактура': { ru: 'уплаченные деньги − полученные счета-фактуры', en: 'money paid − invoices received' },
  'Рақамлар САҚЛАНГАН чиқим сверкаларидан олинган.': { ru: 'Цифры взяты из СОХРАНЁННЫХ сверок расходов.', en: 'The numbers come from SAVED outgoing reconciliations.' },
  'Сверка қилиш учун аввал корхона қўшинг.': { ru: 'Чтобы начать сверку, сначала добавьте организацию.', en: 'To start reconciling, add a company first.' },
  'бу йил учун сақланган сверка йўқ': { ru: 'за этот год сохранённых сверок нет', en: 'no saved reconciliation for this year' },

  // ---------- Сверка экранлари ----------
  'Тўланган пул жами': { ru: 'Всего уплачено', en: 'Total paid' },
  'тушган пул': { ru: 'поступившие деньги', en: 'money received' },
  'тасида фарқ бор': { ru: 'с расхождением', en: 'have a difference' },
  'Жами қарз': { ru: 'Всего долга', en: 'Total receivable' },

  'ҳаммаси': { ru: 'все', en: 'all' },
  'бошқа тоифадаги контрагент йўқ': { ru: 'контрагентов других категорий нет', en: 'no counterparties in other categories' },

  'Сақланган ҳисобот': { ru: 'Сохранённый отчёт', en: 'Saved report' },

  'Кўрсатув учун маълумотлар олдиндан тўлдирилган — «Тизимга кириш»ни босинг': {
    ru: 'Данные заполнены заранее для демонстрации — нажмите «Вход в систему»',
    en: 'Fields are pre-filled for the demo — just press “Sign in”',
  },


  // ---------- SMS вақт чегараси ----------
  'SMS юборилмади: текширув жавоб бермади. Саҳифани янгилаб қайта уриниб кўринг ёки email ва парол билан киринг.': {
    ru: 'SMS не отправлено: проверка не ответила. Обновите страницу и попробуйте снова или войдите по email и паролю.',
    en: 'SMS not sent: the verification did not respond. Reload the page and try again, or sign in with email and password.',
  },

  // ---------- Ҳуқуқий саҳифалар ----------
  'Оммавий оферта': {
    ru: 'Публичная оферта',
    en: 'Public offer',
  },
  'Тўловни қайтариш': {
    ru: 'Возврат средств',
    en: 'Refunds',
  },
  'Алоқа ва реквизитлар': {
    ru: 'Контакты и реквизиты',
    en: 'Contacts and details',
  },
  'Ижрочи реквизитлари': {
    ru: 'Реквизиты исполнителя',
    en: 'Provider details',
  },
  'Расмий реквизитлар': {
    ru: 'Официальные реквизиты',
    en: 'Official details',
  },
  'Ижрочи': {
    ru: 'Исполнитель',
    en: 'Provider',
  },
  'Мақоми': {
    ru: 'Статус',
    en: 'Status',
  },
  'Маълумотнома': {
    ru: 'Справка',
    en: 'Certificate',
  },
  'Берган орган': {
    ru: 'Кем выдана',
    en: 'Issued by',
  },
  'Фаолият тури': {
    ru: 'Вид деятельности',
    en: 'Activity',
  },
  'Фаолият манзили': {
    ru: 'Адрес деятельности',
    en: 'Place of activity',
  },
  'Ўзини ўзи банд қилган шахс': {
    ru: 'Самозанятое лицо',
    en: 'Self-employed person',
  },
  'Ўзбекистон Республикаси Солиқ қўмитаси': {
    ru: 'Налоговый комитет Республики Узбекистан',
    en: 'Tax Committee of the Republic of Uzbekistan',
  },
  'Дастурий таъминот ишлаб чиқиш': {
    ru: 'Разработка программного обеспечения',
    en: 'Software development',
  },
  'Тошкент вилояти, Ангрен шаҳар': {
    ru: 'Ташкентская область, город Ангрен',
    en: 'Tashkent region, city of Angren',
  },
  'Савол, таклиф ёки тўлов бўйича мурожаат — қуйидаги манзилларга ёзинг.': {
    ru: 'Вопрос, предложение или обращение по оплате — пишите по адресам ниже.',
    en: 'Questions, suggestions or payment enquiries — use the contacts below.',
  },
  'Иш вақти: душанба–жума, 9:00–18:00 (Тошкент вақти).': {
    ru: 'Часы работы: понедельник–пятница, 9:00–18:00 (ташкентское время).',
    en: 'Working hours: Monday to Friday, 9:00–18:00 (Tashkent time).',
  },
  'Хатларга бир иш куни ичида жавоб берилади. Тўловни қайтариш аризаси 3 иш кунида кўрилади.': {
    ru: 'На письма отвечаем в течение одного рабочего дня. Заявление на возврат рассматривается за 3 рабочих дня.',
    en: 'We reply to messages within one business day. Refund requests are reviewed within 3 business days.',
  },

  // ---------- Паролни тиклаш ----------
  'Паролни унутдингизми?': {
    ru: 'Забыли пароль?',
    en: 'Forgot your password?',
  },
  'Аввал email манзилни ёзинг.': {
    ru: 'Сначала введите email.',
    en: 'Enter your email first.',
  },
  'Тиклаш ҳаволаси юборилди. Почтангизни (ва «Спам» папкасини) текширинг.': {
    ru: 'Ссылка для восстановления отправлена. Проверьте почту (и папку «Спам»).',
    en: 'A reset link has been sent. Check your inbox (and the spam folder).',
  },
  'Хат юборилмади. Кейинроқ қайта уриниб кўринг.': {
    ru: 'Письмо не отправлено. Попробуйте позже.',
    en: 'The email could not be sent. Please try again later.',
  },
  'Жуда кўп уриниш. Бир оздан сўнг қайта уриниб кўринг.': {
    ru: 'Слишком много попыток. Повторите чуть позже.',
    en: 'Too many attempts. Please try again shortly.',
  },
  'Бу электрон почта аллақачон рўйхатдан ўтган. «Кириш» бўлимига ўтинг — паролни эсламасангиз, «Паролни унутдингизми?» тугмасини босинг.': {
    ru: 'Этот email уже зарегистрирован. Перейдите в раздел «Вход» — если не помните пароль, нажмите «Забыли пароль?».',
    en: 'This email is already registered. Go to “Sign in” — if you do not remember the password, use “Forgot your password?”.',
  },

  // ---------- Телефон билан кириш (SMS) ----------
  'Телефон рақамингизни киритинг — парол керак эмас': {
    ru: 'Введите номер телефона — пароль не нужен',
    en: 'Enter your phone number — no password needed',
  },
  'Телефон рақами': { ru: 'Номер телефона', en: 'Phone number' },
  '+998 автоматик қўшилади': { ru: '+998 добавится автоматически', en: '+998 is added automatically' },
  'SMS код олиш': { ru: 'Получить SMS-код', en: 'Get SMS code' },
  'Юборилмоқда...': { ru: 'Отправка...', en: 'Sending...' },
  'SMS кодни киритинг': { ru: 'Введите SMS-код', en: 'Enter the SMS code' },
  'SMS код': { ru: 'SMS-код', en: 'SMS code' },
  'Код юборилди': { ru: 'Код отправлен', en: 'Code sent to' },
  'Рақамни ўзгартириш': { ru: 'Изменить номер', en: 'Change number' },
  'Телефон рақами нотўғри. Мисол: 90 123 45 67': {
    ru: 'Неверный номер телефона. Пример: 90 123 45 67',
    en: 'Invalid phone number. Example: 90 123 45 67',
  },
  'Email ва парол билан кириш': {
    ru: 'Войти по email и паролю', en: 'Sign in with email and password',
  },
  'Телефон рақами билан кириш': {
    ru: 'Войти по номеру телефона', en: 'Sign in with a phone number',
  },
  'Email билан кириш': { ru: 'Вход по email', en: 'Sign in with email' },

  "SMS юбориш учун Firebase'да Blaze режаси ёқилиши керак (ҳозир бепул Spark режаси). Email ва парол билан киришингиз мумкин.": {
    ru: 'Для отправки SMS в Firebase нужен тариф Blaze (сейчас бесплатный Spark). Вы можете войти по email и паролю.',
    en: 'Sending SMS requires the Blaze plan in Firebase (currently the free Spark plan). You can sign in with email and password.',
  },

  // ---------- Иш майдони аъзолари ----------
  'Жамоа': { ru: 'Команда', en: 'Team' },
  'Иш майдони аъзолари': { ru: 'Участники рабочего пространства', en: 'Workspace members' },
  'Аъзо сизнинг барча корхонангизни ва сверкаларингизни кўради.': {
    ru: 'Участник видит все ваши предприятия и сверки.',
    en: 'A member sees all your companies and reconciliations.',
  },
  'Таклиф қилиш': { ru: 'Пригласить', en: 'Invite' },
  'Таклиф қилинди': { ru: 'Приглашение отправлено', en: 'Invited' },
  'Шу email ёки телефон билан рўйхатдан ўтганда — иш майдонингизга тушади.': {
    ru: 'Когда он зарегистрируется с этим email или телефоном — попадёт в ваше рабочее пространство.',
    en: 'When they sign up with this email or phone, they join your workspace.',
  },
  'Парол керак эмас: шу email ёки телефон билан рўйхатдан ўтса — ўзи иш майдонингизга тушади. SMS билан кирадиган ҳамкасбни ТЕЛЕФОН рақами билан таклиф қилинг.': {
    ru: 'Пароль не нужен: если зарегистрируется с этим email или телефоном — сам попадёт в ваше рабочее пространство. Коллегу, который входит по SMS, приглашайте по НОМЕРУ ТЕЛЕФОНА.',
    en: 'No password needed: signing up with this email or phone joins your workspace automatically. Invite a colleague who signs in by SMS using their PHONE NUMBER.',
  },
  'hamkasb@example.com ёки 90 123 45 67': {
    ru: 'hamkasb@example.com или 90 123 45 67',
    en: 'colleague@example.com or 90 123 45 67',
  },
  'Электрон почта ёки телефон рақами нотўғри.': {
    ru: 'Неверный email или номер телефона.',
    en: 'Invalid email or phone number.',
  },
  'эга': { ru: 'владелец', en: 'owner' },
  'аъзо': { ru: 'участник', en: 'member' },
  'рўйхатдан ўтмаган': { ru: 'не зарегистрирован', en: 'not registered' },
  'Чиқариш': { ru: 'Исключить', en: 'Remove' },
  'Чиқарилди': { ru: 'Исключён', en: 'Removed' },
  'иш майдонидан чиқарилсинми?': {
    ru: 'исключить из рабочего пространства?', en: 'remove from the workspace?',
  },
  'Бу одам энди сизнинг маълумотингизни кўрмайди.': {
    ru: 'Этот человек больше не видит ваши данные.',
    en: 'This person no longer sees your data.',
  },
  'Аъзоларни фақат иш майдони эгаси бошқаради.': {
    ru: 'Участниками управляет только владелец рабочего пространства.',
    en: 'Only the workspace owner manages members.',
  },
  'Кўпроқ фойдаланувчи керак бўлса — бизга айтинг, режани очамиз.': {
    ru: 'Нужно больше пользователей — скажите нам, откроем тариф.',
    en: 'Need more users — tell us and we will open the plan.',
  },

  // ---------- Контрагентларни бирлаштириш ----------
  'Контрагентларни бирлаштириш': {
    ru: 'Объединение контрагентов', en: 'Merge counterparties',
  },
  'Битта фирма икки хил ёзилган бўлса — қаторларни қўшинг. Йиғинди ўзгармайди.': {
    ru: 'Если одна фирма записана по-разному — объедините строки. Сумма не изменится.',
    en: 'If one company is spelled differently — merge the rows. Totals stay the same.',
  },
  'Битта фирма икки хил ёзилган бўлса — қаторларни қўшинг': {
    ru: 'Если одна фирма записана по-разному — объедините строки',
    en: 'If one company is spelled differently — merge the rows',
  },
  'Бирлаштириш': { ru: 'Объединить', en: 'Merge' },
  'Ажратиш': { ru: 'Разделить', en: 'Split' },
  'Бирлаштирилди': { ru: 'Объединено', en: 'Merged' },
  'Ажратилди': { ru: 'Разделено', en: 'Split' },
  'бирлаштирилган': { ru: 'объединено', en: 'merged' },
  'Бирлаштирилганлар': { ru: 'Объединённые', en: 'Merged groups' },
  'Ўхшаш деб топилганлар': { ru: 'Найдены похожие', en: 'Possible matches' },
  'бир хил СТИР': { ru: 'одинаковый ИНН', en: 'same TIN' },
  'ўхшаш ном': { ru: 'похожее название', en: 'similar name' },
  'та қатор битта контрагентга йиғилди': {
    ru: 'строк объединены в одного контрагента', en: 'rows merged into one counterparty',
  },
  'Жадвал файлларни қайта юклаганда алоҳида кўринади.': {
    ru: 'Таблица разделится при следующей загрузке файлов.',
    en: 'The table will split again on the next upload.',
  },
  'Тизим ўзи бирлаштирмайди — фақат кўрсатади. Тасдиқлашдан олдин СТИР ва номни солиштиринг.': {
    ru: 'Система не объединяет сама — только показывает. Перед подтверждением сверьте ИНН и название.',
    en: 'The system never merges on its own — it only suggests. Check the TIN and name before confirming.',
  },
  'Камида иккита қаторни белгиланг': {
    ru: 'Отметьте минимум две строки', en: 'Select at least two rows',
  },
  'та танланди': { ru: 'выбрано', en: 'selected' },
  'асосий': { ru: 'основной', en: 'primary' },
  'та қатор': { ru: 'строк', en: 'rows' },
  'СТИРсиз': { ru: 'без ИНН', en: 'no TIN' },
  'Ҳеч нарса топилмади': { ru: 'Ничего не найдено', en: 'Nothing found' },
  'Рўйхатда энг катта 200 та кўрсатилди — қолганини қидирув орқали топинг.': {
    ru: 'Показаны 200 крупнейших — остальных найдите через поиск.',
    en: 'Showing the 200 largest — use search for the rest.',
  },

  // ---------- Ҳисобот тарихи ----------
  'та сақланган ҳисобот': { ru: 'сохранённых отчётов', en: 'saved reports' },
  'охиргиси': { ru: 'последний', en: 'latest' },
  'Сақланган сана': { ru: 'Дата сохранения', en: 'Saved on' },
  'Контрагент': { ru: 'Контрагентов', en: 'Counterparties' },
  'экранда': { ru: 'на экране', en: 'on screen' },
  'Ўчириш': { ru: 'Удалить', en: 'Delete' },
  'Амаллар': { ru: 'Действия', en: 'Actions' },
  'Ҳисобот ўчирилди': { ru: 'Отчёт удалён', en: 'Report deleted' },
  'сақланган ҳисоботни ўчирасизми? Бу амални қайтариб бўлмайди.': {
    ru: 'удалить сохранённый отчёт? Это действие необратимо.',
    en: 'delete this saved report? This cannot be undone.',
  },
  'Бу ҳисоботда контрагент йўқ.': {
    ru: 'В этом отчёте нет контрагентов.',
    en: 'This report has no counterparties.',
  },
  'Сақланган ҳисобот кўп — саҳифа секин очилади. Эскиларини ўчиринг.': {
    ru: 'Сохранённых отчётов много — страница открывается медленно. Удалите старые.',
    en: 'Many saved reports — the page loads slowly. Delete the old ones.',
  },
  'Ҳисобот жуда катта — сақлаб бўлмади': { ru: 'Отчёт слишком большой — не сохранён', en: 'Report too large — not saved' },
  'чегара': { ru: 'предел', en: 'limit' },
  'Даврни қисқартириб қайта юкланг.': { ru: 'Сократите период и загрузите заново.', en: 'Shorten the period and upload again.' },

  'Ўзгартирган': { ru: 'Изменил', en: 'Changed by' },

  // ---------- Режа чекловига етганда ----------
  'Режа чекловига етдингиз': { ru: 'Достигнут предел тарифа', en: 'Plan limit reached' },
  'Ҳозирги режада': { ru: 'На текущем тарифе', en: 'On the current plan' },
  'тагача корхона қўшиш мумкин.': { ru: 'организаций можно добавить.', en: 'companies can be added.' },
  'Сизда': { ru: 'У вас', en: 'You have' },
  'та бор.': { ru: 'шт.', en: 'of them.' },
  'Кўпроқ корхона керак бўлса — айтинг. Тариф ҳали ишга туширилмаган, шунинг учун ҳозир пул сўралмайди.': { ru: 'Нужно больше организаций — скажите. Тариф ещё не запущен, поэтому оплата сейчас не требуется.', en: 'Need more companies — tell us. The paid plan is not live yet, so nothing is charged now.' },
  'Кўпроқ керак': { ru: 'Нужно больше', en: 'I need more' },
  'Сўровингиз қайд этилди': { ru: 'Ваш запрос записан', en: 'Your request is recorded' },
  'Раҳмат! Тариф тайёр бўлганда хабар берамиз.': { ru: 'Спасибо! Сообщим, когда тариф будет готов.', en: 'Thanks! We will let you know when the plan is ready.' },
  'Хабарингиз юборилмади, лекин биз билан боғланишингиз мумкин.': { ru: 'Сообщение не отправлено, но вы можете связаться с нами.', en: 'The message was not sent, but you can still contact us.' },

  // ---------- Мижозлар рўйхатидаги ҳолат ----------
  'Ҳолат': { ru: 'Состояние', en: 'Status' },
  'ҳаммаси мос': { ru: 'всё сходится', en: 'all matched' },
  // «тасида фарқ» юқорида (530-қатор) аллақачон бор

  // ---------- Чиқим томонидаги акт ----------
  'Дебет (тўлов)': { ru: 'Дебет (оплата)', en: 'Debit (payment)' },
  'Кредит (фактура)': { ru: 'Кредит (счёт-фактура)', en: 'Credit (invoice)' },
  'Улар қарздор — етказиб берувчи': { ru: 'Должны они — поставщик', en: 'They owe — the supplier' },
  'сўмлик фактура ёзмаган.': { ru: 'сум счетов-фактур не выставил.', en: 'has not invoiced that amount.' },
  'сўм тўланмаган.': { ru: 'сум не оплачено.', en: 'remains unpaid.' },
  'Бу контрагентга бошланғич қолдиқ киритилмаган — акт фақат юкланган давр ҳаракатини кўрсатади.': { ru: 'Для этого контрагента сальдо начальное не введено — акт покажет только обороты загруженного периода.', en: 'No opening balance entered for this counterparty — the act will show only the loaded period.' },

  // ---------- Ёпилмаган фактуралар ----------
  'Тўланмаган фактуралар': { ru: 'Неоплаченные счета-фактуры', en: 'Unpaid invoices' },
  'Ёпилмаган фактура йўқ': { ru: 'Незакрытых счетов-фактур нет', en: 'No open invoices' },
  'Ҳужжат': { ru: 'Документ', en: 'Document' },
  'Ёпилган': { ru: 'Закрыто', en: 'Settled' },
  'Қолдиқ': { ru: 'Остаток', en: 'Outstanding' },
  'Ёши': { ru: 'Возраст', en: 'Age' },
  'Сансиз': { ru: 'Без даты', en: 'No date' },
  'Тўловлар энг эски фактурадан бошлаб ёпилади (FIFO). Қисман ёпилган фактура ҳам шу рўйхатда — қолдиғи билан.': { ru: 'Платежи закрывают счета-фактуры начиная с самой старой (FIFO). Частично закрытые тоже в списке — с остатком.', en: 'Payments settle invoices oldest-first (FIFO). Partly settled invoices are listed too, with the remainder.' },

  // ---------- Бошланғич қолдиқ ----------
  'Бошланғич қолдиқ': { ru: 'Сальдо начальное', en: 'Opening balance' },
  'Якуний қолдиқ': { ru: 'Сальдо конечное', en: 'Closing balance' },
  'Бошланғич қолдиқ сақланди': { ru: 'Сальдо начальное сохранено', en: 'Opening balance saved' },
  'Қолдиқ санаси': { ru: 'Дата сальдо', en: 'Balance date' },
  'Қолдиқ санасини киритинг': { ru: 'Укажите дату сальдо', en: 'Enter the balance date' },
  'Одатда — юкланган давр бошланишидан бир кун олдин': { ru: 'Обычно — за день до начала загруженного периода', en: 'Usually the day before the loaded period starts' },
  'Файл бошланишидан ОЛДИНГИ давр қолдиғи': { ru: 'Сальдо за период ДО начала файла', en: 'Balance for the period BEFORE the file starts' },
  'Файл бошланишидан ОЛДИНГИ давр қолдиғи. Мусбат — улар қарздор, манфий — биз қарздормиз.': { ru: 'Сальдо за период ДО начала файла. Положительное — должны они, отрицательное — должны мы.', en: 'Balance for the period BEFORE the file starts. Positive — they owe us, negative — we owe them.' },
  'Киритилди': { ru: 'Введено', en: 'Entered' },

  // ---------- Топилган давр ----------
  // «Фактура» юқорида (186-қатор) аллақачон бор
  'Кўчирма': { ru: 'Выписка', en: 'Statement' },

  // ---------- Кириш ----------
  'Тизим қандай ишлайди?': { ru: 'Как работает система?', en: 'How does the system work?' },
  'Синов режими — маълумотлар олдиндан тўлдирилган': { ru: 'Тестовый режим — поля заполнены заранее', en: 'Test mode — fields are pre-filled' },
  'Битта корхонада синаб кўринг': { ru: 'Попробуйте на одной организации', en: 'Try it on one company' },
  'Энг чалкаш мижозингизнинг банк кўчирмаси ва фактура рўйхатини юкланг. Фарқ борми — бир дақиқада биласиз.': { ru: 'Загрузите выписку и реестр счетов-фактур самого запутанного клиента. Есть ли расхождение — узнаете за минуту.', en: 'Upload the bank statement and invoice register of your messiest client. Whether there is a difference — you will know in a minute.' },
  'Тизим нима қилади, файлларни қандай юкланади ва натижани қандай ўқилади — уч қадамда, мисоллар билан.': { ru: 'Что делает система, как загружать файлы и как читать результат — в три шага, с примерами.', en: 'What the system does, how to upload files and how to read the result — in three steps, with examples.' },

  // ---------- Контрагент тоифалари ----------
  'Банк комиссияси': { ru: 'Банковская комиссия', en: 'Bank fee' },
  'банк комиссияси': { ru: 'банковская комиссия', en: 'bank fee' },
  'Банкнинг ўз даромад ҳисоби': { ru: 'Собственный доходный счёт банка', en: "The bank's own income account" },
  'Ғазначилик ягона ҳисобварағи': { ru: 'Единый казначейский счёт', en: 'Single treasury account' },
  'Молия вазирлиги ғазначилиги': { ru: 'Казначейство Министерства финансов', en: 'Ministry of Finance treasury' },
  'иссиқлик': { ru: 'теплоснабжение', en: 'heating' },
  'чиқинди': { ru: 'вывоз отходов', en: 'waste collection' },
  'ёнғин хавфсизлиги': { ru: 'пожарная безопасность', en: 'fire safety' },
};
