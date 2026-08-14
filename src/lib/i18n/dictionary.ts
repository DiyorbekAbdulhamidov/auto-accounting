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
};
