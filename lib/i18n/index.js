const fs = require('fs');
const path = require('path');

const languages = {};
(() => {
    const dirPath = path.join(__dirname, 'locales');
    const files = fs.readdirSync(dirPath);
    files.forEach(fileName => {
        const languageName = fileName.split('.')[0];
        languages[languageName] = require(path.join(dirPath, fileName));
    });
})();

const __ = function(key, ...params) {
    var language = 'en'
    if( this.headers && this.headers['accept-language'] ){
         language = this.headers['accept-language'] 
    }
    

    const l10n = languages[language] || languages['en'];
    let message = l10n[key] || key;
    let position = 0;
    params.forEach(param => {
        message = message.replace(new RegExp('\\{' + position + '}'), param);
        position++;
    });
    return message;
};

const withLanguage = language =>
    __.bind({
        headers: {
            'accept-language': language,
        },
    });

module.exports = {
    __,
    languages,
    withLanguage,
};
