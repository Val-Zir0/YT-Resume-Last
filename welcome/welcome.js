const translations = {
    en: {
        title: "YT Resume Last",
        welcomeHeader: "Welcome to the Future of YouTube!",
        welcomeDesc: "Never lose your place again. Seamlessly resume your videos and music exactly where you left off, with full control over volume, speed, and playlists.",
        featuresTitle: "Features",
        feature1: "Auto-resume videos & music",
        feature2: "Restore exact timestamp",
        feature3: "Restore playback speed & volume",
        feature4: "Restore playlists & shuffle/repeat",
        feature5: "Granular control for every feature",
        howToUseTitle: "How to Use",
        howToUseDesc1: "1. Watch any video on YouTube or listen to a track on YouTube Music.",
        howToUseDesc2: "2. Close the tab. Your session is automatically saved!",
        howToUseDesc3: "3. Open YouTube again, and the extension will magically redirect you to where you left off.",
        licenseTitle: "License & Agreement",
        licenseDesc: "By using this extension, you agree to use it as intended for personal use. The developer does not collect, store, or sell any of your personal browsing data. All settings and history are stored locally on your device.",
        developedBy: "Developed with ❤️ by Fares Hamed",
        visitPortfolio: "Visit Developer Portfolio",
        portfolioUrl: "https://fares-hamed.kesug.com/"
    },
    ar: {
        title: "استئناف يوتيوب الأخير",
        welcomeHeader: "مرحباً بك في مستقبل يوتيوب!",
        welcomeDesc: "لن تفقد مكانك أبداً بعد الآن. استأنف مشاهدة الفيديوهات والموسيقى بسلاسة من حيث توقفت، مع تحكم كامل في الصوت، السرعة، وقوائم التشغيل.",
        featuresTitle: "المميزات",
        feature1: "استئناف تلقائي للفيديوهات والموسيقى",
        feature2: "استعادة الثانية التي توقفت عندها بالضبط",
        feature3: "استعادة سرعة ومستوى الصوت",
        feature4: "استعادة قوائم التشغيل، والتشغيل العشوائي/المتكرر",
        feature5: "تحكم دقيق لتفعيل وإلغاء كل ميزة",
        howToUseTitle: "طريقة الاستخدام",
        howToUseDesc1: "1. شاهد أي فيديو على يوتيوب أو استمع لمقطع على يوتيوب ميوزك.",
        howToUseDesc2: "2. أغلق التبويب، وسيتم حفظ جلستك تلقائياً وبصمت!",
        howToUseDesc3: "3. افتح يوتيوب مرة أخرى، وستقوم الإضافة بتوجيهك سحرياً للمكان الذي غادرته.",
        licenseTitle: "الرخصة والاتفاقية",
        licenseDesc: "باستخدامك لهذه الإضافة، فإنك توافق على استخدامها للأغراض الشخصية. المطور لا يقوم بجمع، تخزين، أو بيع أي بيانات تصفح خاصة بك. جميع الإعدادات والسجلات تحفظ محلياً على جهازك فقط.",
        developedBy: "تم التطوير بـ ❤️ بواسطة فارس حامد",
        visitPortfolio: "زيارة معرض أعمال المطور",
        portfolioUrl: "https://fares-hamed.kesug.com/AR"
    }
};

let currentLang = 'en'; // default
const langToggleBtn = document.getElementById('langToggle');
const portfolioLink = document.getElementById('portfolioLink');

function updateContent() {
    const t = translations[currentLang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (key === 'developedBy') {
                el.innerHTML = currentLang === 'ar' 
                    ? 'تم التطوير بـ ❤️ بواسطة <strong>فارس حامد</strong>'
                    : 'Developed with ❤️ by <strong>Fares Hamed</strong>';
            } else {
                el.textContent = t[key];
            }
        }
    });

    // Update HTML lang attribute and button text
    document.documentElement.lang = currentLang;
    langToggleBtn.textContent = currentLang === 'en' ? 'عربي' : 'English';
    
    // Update portfolio link
    portfolioLink.href = t.portfolioUrl;
}

// Check if browser is Arabic by default
if (navigator.language.startsWith('ar')) {
    currentLang = 'ar';
}

// Initial render
updateContent();

// Toggle event
langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    updateContent();
});
