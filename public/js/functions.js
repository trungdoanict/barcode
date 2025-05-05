const $ = require('jquery');
const config = require('./../../config.js');
const fs = require('fs');

const captcha_api = 'https://merchvn.net/manager/api-tool/pass-captcha';

async function isPageLoggedIn(page) {
    /*let logoutSelector = '.logout-link';
    if (await page.$(logoutSelector) != null) {
        return true;
    }*/

    if (await findSelector(page, ".header-content .header-item", "Sign out")) {
        return true;
    }

    return false;
}

async function fillLogin(page, email, password) {
    let emailSel = '#ap_email';
    let passSel = '#ap_password';
    let captchaSel = '#auth-captcha-guess';
    let submitBtn = '#signInSubmit';

    if (await page.$(emailSel) != null) {
        // await page.click(emailSel);
        await page.type(emailSel, ''); await botSleep(0);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(emailSel, email);

        await botSleep(1);
    }

    if (await page.$(passSel) != null) {
        // await page.click(passSel);
        await page.type(passSel, ''); await botSleep(0);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(passSel, password);

        await botSleep(1);
    }

    if (await page.$(captchaSel) != null) {
        // get captcha image
        const imgs = await page.$$eval('#auth-captcha-image', imgs => imgs.map(img => img.getAttribute('src')));
        const captchaImg = imgs[0];

        try {
            let captcha_text = await getCaptchaText(captchaImg);
            if (captcha_text.status) {
                // await page.click(captchaSel);
                await page.type(captchaSel, ''); await botSleep(0);
                await page.keyboard.down('Control');
                await page.keyboard.press('KeyA');
                await page.keyboard.up('Control');
                await page.type(captchaSel, captcha_text.captcha);

                await botSleep(1);
            }
        } catch {}

        // await botSleep(3);
    }

    if (await page.$(submitBtn) != null) {
        await botClick(submitBtn, page);
    }
}

/* ================== Upload Functions ==================== */
async function botUploadPPB(page, configs, u_config, path_file, u_data, log, accTpl) {
    // init 
    configs.upload = false; // set success upload to false;

    try {
        // eBook button wait for
        let eBookBtn = '#create-paperback-button';
        await botSessionWaitfor(page, eBookBtn, accTpl, 60000);

        // click submit new ebook
        await botSleep(1);
        await botSleep(1);
        await botClick(eBookBtn, page); 

        let tabDetails = "#book-setup-navigation-bar-details-link";
        await botSessionWaitfor(page, tabDetails, accTpl, 60000);

        await botSleep(1);
    } catch (error) {
        console.log(error);
        configs.message = "go to ebook step1 " + error.message ;
        return configs;
    }

    try {
        console.log("start fill infos");

        // start fill infos
        let titleInput = "#data-print-book-title";
        let subtitleInput = "#data-print-book-subtitle";
        let seriesNameInput = "#data-print-book-series-title";
        let seriesNumberInput = "#data-print-book-series-number";
        let authorFirstInput = "#data-print-book-primary-author-first-name";
        let authorMiddleInput = "#data-print-book-primary-author-middle-name";
        let authorLastInput = "#data-print-book-primary-author-last-name";

        // remove special character
        let titleText = u_data[2].replace(/(\r\n|\n|\r)/gm, "");

        // wait for categories shown
        await waitForElement(page, titleInput); 
        await botSleep(1);

        // type input
        if (u_data[2]) { let titleText = u_data[2].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, titleInput, titleText); }
        if (u_data[3]) { let subtitleText = u_data[3].replace(/(\r\n|\n|\r)/gm, ""); await pasteInput(subtitleText, subtitleInput, page); }
        
        try {
            if (u_data[4]) { let seriesNameText = u_data[4].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, seriesNameInput, seriesNameText); }
            if (u_data[5]) { let seriesNumberText = u_data[5].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, seriesNumberInput, seriesNumberText); }
        } catch (error) {
            console.log(error);
        }

        try {
            if (u_data[7]) { let authorFirstText = u_data[7].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, authorFirstInput, authorFirstText); }
            if (u_data[8]) { let authorMiddleText = u_data[8].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, authorMiddleInput, authorMiddleText); }
            if (u_data[9]) { let authorLastText = u_data[9].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, authorLastInput, authorLastText); }
        } catch (error) {
            console.log(error);
        }

        // type description
        if (u_data[6] != "") {
            let description = u_data[6];
            await pasteInput(description, "#data-print-book-description", page);
        }

        // scroll to copy rights
        await page.$eval('#section-publishing-rights', (el) => el.scrollIntoView());

        // click copy rights
        await botSleep(1);
        let copyrightSetting = u_config.owner_or_public_domain;
        if (copyrightSetting == "Public domain") {
            await botClick("#public-domain", page);
        } else {
            await botClick("#non-public-domain", page);
        }

        // type keywords
        let countKeyword = 0;
        let maxKeywords = 7;
        if (u_data[10] != "") {
            let strArr = u_data[10].split(',');
            if (strArr.length > 0) {
                for( let word of strArr) {
                    let r_word = (word.substr(0,1) == " ") ? word.substr(1) : word;
                    r_word = r_word.replace(/(\r\n|\n|\r)/gm, "");
                    
                    if (countKeyword < maxKeywords) {
                        // type keyword
                        let keywordInput = "#data-print-book-keywords-" + countKeyword;
                        // await typeEmptyInput(page, keywordInput, r_word);
                        await pasteInput(r_word, keywordInput, page);

                        countKeyword++;
                    } else {
                        break;
                    }
                }
            }
        } 

        // select categories
        let categories = u_config.categories;
        await botSleep(1);
        let showCatBtn = "#data-print-book-categories-button-proto-announce";
        await botClick(showCatBtn, page);

        // wait for categories shown
        let saveCatBtn = '#category-chooser-ok-button-announce';
        await waitForElement(page, saveCatBtn); 

        let catSelectors = {
            'fiction': '#icon-fiction',
            'fiction_childrens': {
                "General": "#checkbox-fiction_general",
                "Action & Adventure": "#checkbox-fiction_action-and-adventure",
                "Classics": "#checkbox-fiction_classics",
                "Erotica": "#checkbox-fiction_erotica",
                "Fairy Tales, Folk Tales, Legends & Mythology": "#checkbox-fiction_fairy-tales-folk-tales-legends-and-mythology",
                "Ghost": "#checkbox-fiction_ghost",
                "Horror": "#checkbox-fiction_horror",
                "Humorous": "#checkbox-fiction_humorous",
                "Short Stories": "#checkbox-fiction_short-stories-single-author",
                "Sports": "#checkbox-fiction_sports",
                "Superheroes": "#checkbox-fiction_superheroes",
                "Fantasy": {
                    "Expand": "#icon-fiction_fantasy",
                    "General": "#checkbox-fiction_fantasy_general",
                    "Dark Fantasy": "#checkbox-fiction_fantasy_dark-fantasy",
                    "Epic": "#checkbox-fiction_fantasy_epic",
                    "Historical": "#checkbox-fiction_fantasy_historical",
                    "Paranormal": "#checkbox-fiction_fantasy_paranormal",
                    "Urban": "#checkbox-fiction_fantasy_urban"
                },
                "Mystery & Detective": {
                    "Expand": "#icon-fiction_mystery-and-detective",
                    "General": "#checkbox-fiction_mystery-and-detective_general"
                },
                "Science Fiction": {
                    "Expand": "#icon-fiction_science-fiction",
                    "General": "#checkbox-fiction_science-fiction_general",
                    "Action & Adventure": "#checkbox-fiction_science-fiction_action-and-adventure",
                    "Space Opera": "#checkbox-fiction_science-fiction_space-opera"
                },
                "Thrillers": {
                    "Expand": "#icon-fiction_thrillers",
                    "General": "#checkbox-fiction_thrillers_general",
                    "Supernatural": "#checkbox-fiction_thrillers_supernatural"
                },
                "Romance": {
                    "Expand": "#icon-fiction_romance",
                    "General": "#checkbox-fiction_romance_general",
                    "Collections & Anthologies": "#checkbox-fiction_romance_collections-and-anthologies",
                    "Erotica": "#checkbox-fiction_romance_erotica",
                    "Fantasy": "#checkbox-fiction_romance_fantasy",
                    "Gay": "#checkbox-fiction_romance_gay",
                    "New Adult": "#checkbox-fiction_romance_new-adult",
                    "Paranormal": "#checkbox-fiction_romance_paranormal",
                    "Romantic Comedy": "#checkbox-fiction_romance_romantic-comedy",
                    "Science Fiction": "#checkbox-fiction_romance_science-fiction",
                },
                "Sagas": "#checkbox-fiction_sagas",
                "Urban": "#checkbox-fiction_urban"
            },
            'juvenile_fiction': '#icon-juvenile-fiction',
            'juvenile_fiction_childrens': {
                "Activity Book": "#checkbox-juvenile-fiction_activity-books",
                "Fantasy & Magic": "#checkbox-juvenile-fiction_fantasy-and-magic",
                "Monsters": "#checkbox-juvenile-fiction_monsters",
                "Mysteries & Detective Stories": "#checkbox-juvenile-fiction_mysteries-and-detective-stories",
                "Nursery Rhymes": "#checkbox-juvenile-fiction_nursery-rhymes",
                "Picture Books": "#checkbox-juvenile-fiction_picture-books",
                "Robots": "#checkbox-juvenile-fiction_robots",
                "Short Stories": "#checkbox-juvenile-fiction_short-stories",
                "Action & Adventures": {
                    "Expand": "#icon-juvenile-fiction_action-and-adventure",
                    "General": "#checkbox-juvenile-fiction_action-and-adventure_general"
                },
                "Comics & Graphic Novels": {
                    "Expand": "#icon-juvenile-fiction_comics-and-graphic-novels",
                    "General": "#checkbox-juvenile-fiction_comics-and-graphic-novels_general",
                    "Manga": "#checkbox-juvenile-fiction_comics-and-graphic-novels_manga",
                    "Media Tie In": "#checkbox-juvenile-fiction_comics-and-graphic-novels_media-tie--in",
                    "Superheroes": "#checkbox-juvenile-fiction_comics-and-graphic-novels_superheroes"
                },
                "Concepts": {
                    "Expand": "#icon-juvenile-fiction_concepts",
                    "General": "#checkbox-juvenile-fiction_concepts_general",
                    "Alphabets": "#checkbox-juvenile-fiction_concepts_alphabet",
                    "Body": "#checkbox-juvenile-fiction_concepts_body",
                    "Colors": "#checkbox-juvenile-fiction_concepts_colors",
                    "Counting Numbers": "#checkbox-juvenile-fiction_concepts_counting-and-numbers",
                    "Date & Time": "#checkbox-juvenile-fiction_concepts_date-and-time",
                    "Season": "#checkbox-juvenile-fiction_concepts_seasons",
                    "Sound": "#checkbox-juvenile-fiction_concepts_sounds",
                    "Words": "#checkbox-juvenile-fiction_concepts_words",
                },
                "Fairy Tales & Folklore": {
                    "Expand": "#icon-juvenile-fiction_fairy-tales-and-folklore",
                    "General": "#checkbox-juvenile-fiction_fairy-tales-and-folklore_general"
                },
                "Readers": {
                    "Expand": "#icon-juvenile-fiction_readers",
                    "Beginner": "#checkbox-juvenile-fiction_readers_beginner",
                    "Chapter Books": "#checkbox-juvenile-fiction_readers_chapter-books",
                    "Intermediate": "#checkbox-juvenile-fiction_readers_intermediate"
                },
            },
            'comics_grapic_novels': '#icon-comics-and-graphic-novels',
            'commic_childrens': {
                "General": "#checkbox-comics-and-graphic-novels_general",
                "Adaptations": "#checkbox-comics-and-graphic-novels_adaptations",
                "Anthologies": "#checkbox-comics-and-graphic-novels_anthologies",
                "Contemporary Womem": "#checkbox-comics-and-graphic-novels_contemporary-women",
                "Crime & Mystery": "#checkbox-comics-and-graphic-novels_crime-and-mystery",
                "Erotica": "#checkbox-comics-and-graphic-novels_erotica",
                "Fantasy": "#checkbox-comics-and-graphic-novels_fantasy",
                "Historical Fiction": "#checkbox-comics-and-graphic-novels_historical-fiction",
                "Horror": "#checkbox-comics-and-graphic-novels_horror",
                "LGBT": "#checkbox-comics-and-graphic-novels_lgbt",
                "Literary": "#checkbox-comics-and-graphic-novels_literary",
                "Media Tie-In": "#checkbox-comics-and-graphic-novels_media-tie--in",
                "Nonfiction": "#checkbox-comics-and-graphic-novels_nonfiction",
                "Religious": "#checkbox-comics-and-graphic-novels_religious",
                "Romance": "#checkbox-comics-and-graphic-novels_romance",
                "Science Fiction": "#checkbox-comics-and-graphic-novels_science-fiction",
                "Superheroes": "#checkbox-comics-and-graphic-novels_superheroes",
                'Manga': {
                    "Expand": "#icon-comics-and-graphic-novels_manga",
                    "General": "#checkbox-comics-and-graphic-novels_manga_general",
                    "Adult Comics": "#checkbox-comics-and-graphic-novels_manga_adult-comics",
                    "Boy's Love Comics": "#checkbox-comics-and-graphic-novels_manga_boys-love-comics",
                    "Crime & Mystery": "#checkbox-comics-and-graphic-novels_manga_crime-and-mystery",
                    "Erotica": "#checkbox-comics-and-graphic-novels_manga_erotica",
                    "Fantasy": "#checkbox-comics-and-graphic-novels_manga_fantasy",
                    "Historical Fiction": "#checkbox-comics-and-graphic-novels_manga_historical-fiction",
                    "Horror": "#checkbox-comics-and-graphic-novels_manga_horror",
                    "Illustrations & Fanbooks": "#checkbox-comics-and-graphic-novels_manga_illustrations-and-fanbooks",
                    "Josei Manga": "#checkbox-comics-and-graphic-novels_manga_josei-manga",
                    "LGBT": "#checkbox-comics-and-graphic-novels_manga_lgbt",
                    "Media Tie-In": "#checkbox-comics-and-graphic-novels_manga_media-tie--in",
                    "Nonfiction": "#checkbox-comics-and-graphic-novels_manga_nonfiction",
                    "Romance": "#checkbox-comics-and-graphic-novels_manga_romance",
                    "Science Fiction": "#checkbox-comics-and-graphic-novels_manga_science-fiction",
                    "Science Manga": "#checkbox-comics-and-graphic-novels_manga_seinen-manga",
                    "Shonen Manga": "#checkbox-comics-and-graphic-novels_manga_shonen-manga",
                    "Shoujo Manga": "#checkbox-comics-and-graphic-novels_manga_shoujo-manga",
                    "Sports": "#checkbox-comics-and-graphic-novels_manga_sports",
                    "Yaoi Manga": "#checkbox-comics-and-graphic-novels_manga_yaoi"
                }
            }
        };

        let count_cat = 0;
        let maximum_cat = 2;

        // check comic 
        if (categories.comics_grapic_novels.length > 0) {
            // expand comic
            let expandSel = catSelectors.comics_grapic_novels;
            await waitForElement(page, expandSel); await botClick(expandSel, page);

            for(let comic_cat of categories.comics_grapic_novels) {
                if (comic_cat.child.length == 0) { // if last tree, check
                    // wait for this child then click
                    let checkboxSel = catSelectors.commic_childrens[comic_cat.item];
                    if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                    
                } else {
                    // expand this parents
                    expandSel = catSelectors.commic_childrens[comic_cat.item].Expand;
                    await waitForElement(page, expandSel); await botClick(expandSel, page);

                    for(let comic_cat_child of comic_cat.child) {
                        if (comic_cat_child.child.length == 0) { // if last tree, check
                            // wait for this child then click
                            let checkboxSel = catSelectors.commic_childrens[comic_cat.item][comic_cat_child.item];
                            if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                        }
                    }
                }
            }
        }

        // check fiction 
        if (categories.fiction.length > 0) {
            // expand comic
            let expandSel = catSelectors.fiction;
            await waitForElement(page, expandSel); await botClick(expandSel, page);

            for(let fiction_cat of categories.fiction) {
                if (fiction_cat.child.length == 0) { // if last tree, check
                    // wait for this child then click
                    let checkboxSel = catSelectors.fiction_childrens[fiction_cat.item];
                    if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                    
                } else {
                    // expand this parents
                    expandSel = catSelectors.fiction_childrens[fiction_cat.item].Expand;
                    await waitForElement(page, expandSel); await botClick(expandSel, page);

                    for(let fiction_cat_child of fiction_cat.child) {
                        if (fiction_cat_child.child.length == 0) { // if last tree, check
                            // wait for this child then click
                            let checkboxSel = catSelectors.fiction_childrens[fiction_cat.item][fiction_cat_child.item];
                            if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                        }
                    }
                }
            }
        }

        // check juvenile fiction 
        if (categories.juvenile_fiction.length > 0) {
            // expand comic
            let expandSel = catSelectors.juvenile_fiction;
            await waitForElement(page, expandSel); await botClick(expandSel, page);

            for(let juvenile_fiction_cat of categories.juvenile_fiction) {
                if (juvenile_fiction_cat.child.length == 0) { // if last tree, check
                    // wait for this child then click
                    let checkboxSel = catSelectors.juvenile_fiction_childrens[juvenile_fiction_cat.item];
                    if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                    
                } else {
                    // expand this parents
                    expandSel = catSelectors.juvenile_fiction_childrens[juvenile_fiction_cat.item].Expand;
                    await waitForElement(page, expandSel); await botClick(expandSel, page);

                    for(let juv_fiction_cat_child of juvenile_fiction_cat.child) {
                        if (juv_fiction_cat_child.child.length == 0) { // if last tree, check
                            // wait for this child then click
                            let checkboxSel = catSelectors.juvenile_fiction_childrens[juvenile_fiction_cat.item][juv_fiction_cat_child.item];
                            if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                        }
                    }
                }
            }
        }

        // click save
        await botSleep(1);
        await botClick(saveCatBtn, page);

        // check no adult content
        let noAdultContent = await getSelector(page, "#data-print-book-is-adult-content input", 0);
        await botSleep(1);
        await clickElement(noAdultContent, page);

        // click next step
        await botSleep(1);
        await botSleep(1);
        await botClick("#save-and-continue-announce", page);
    } catch (error) {
        console.log(error);
        configs.message = "Step1 " + error ;
        return configs;
    }

    try {
        // click ISBN 
        let isbnSel = "#free-print-isbn-btn-announce";

        try {
            await botSessionWaitfor(page, isbnSel, accTpl, 60000); // timeout 1 minutes
        } catch (error) {
            console.log(error);
            await waitForElement(page, isbnSel);
        }
        
        await botSleep(1);
        await botClick(isbnSel, page);

        // wait for ISBN popup
        assignISBNBtn = '#print-isbn-confirm-button-announce';
        await waitForElement(page, assignISBNBtn);
        await botSleep(1);
        await botClick(assignISBNBtn, page);
        await botSleep(1); await botSleep(1);

        // Print Options
        // Scroll to print options section-interior
        await page.$eval('#section-interior', (el) => el.scrollIntoView());

        // Interior & paper type
        await botSleep(1);
        let print_typeSel = '#' + u_config.print_options.print_type;
        await botClick(print_typeSel, page);

        // open trim size
        let trim_sizeSel = '#' + u_config.print_options.trim_size;
        let trim_sizeBtn = '#trim-size-btn-announce';
        await botSleep(1);
        await botClick(trim_sizeBtn, page);
        await waitForElement(page, trim_sizeSel); 
        await botSleep(1);
        await botClick(trim_sizeSel, page);

        // Bleed settings
        let bleed_settings = '#' + u_config.print_options.bleed_settings;
        await botSleep(1);
        await botClick(bleed_settings, page);

        // Paperback cover
        let paperback_cover = '#' + u_config.print_options.paperback_cover;
        await botSleep(1);
        await botClick(paperback_cover, page);

        // scroll to upload area #section-manuscript
        await page.$eval('#section-manuscript', (el) => el.scrollIntoView());

        // check upload local paper cover
        let localCoverSel = "#data-print-book-publisher-cover-choice-accordion .a-last .a-accordion-radio";
        await botSleep(1);
        await botClick(localCoverSel, page);

        // upload cover file
        let uploadCoverInput = "#data-print-book-publisher-cover-file-upload-AjaxInput";
        try {
            let uploadCoverBtn = await page.$(uploadCoverInput);
            let cover_path = path_file + '/' + u_data[1];

            if (!fs.existsSync(cover_path)) {
                configs.message = "Cover file is not exist!" ;
                return configs;
            }

            // console.log(design_path);
            await uploadCoverBtn.uploadFile(cover_path);
        } catch(error){ 
            configs.message = error.message ;
            return configs;
        }

        // wait for upload success
        let ppbUploadTimeout = u_config.uploadTimeout * 60000;
        let uploadCoverSuccessSel = "#data-print-book-publisher-cover-file-upload-success";
        await page.waitForSelector(uploadCoverSuccessSel, {
          visible: true, timeout: ppbUploadTimeout
        })

        await botSleep(5000);

        // upload paperback
        let uploadBookInput = "#data-print-book-publisher-interior-file-upload-AjaxInput";
        try {
            let uploadBookBtn = await page.$(uploadBookInput);
            let book_path = path_file + '/' + u_data[0];

            if (!fs.existsSync(book_path)) {
                configs.message = "Paperback file is not exist!" ;
                return configs;
            }

            // console.log(design_path);
            await uploadBookBtn.uploadFile(book_path);

            // click continue with pdf file
            try {
                let continuePDF = "#file-warn-extension-continue-announce";
                await waitForElement(page, continuePDF, 10000);
                if (await page.$(continuePDF) != null) {
                    await botClick(continuePDF, page);
                }
            } catch {}
        } catch(error){ 
            configs.message = error.message ;
            return configs;
        }

        // wait for upload success
        let uploadBookSuccessSel = "#data-print-book-publisher-interior-file-upload-success";
        await page.waitForSelector(uploadBookSuccessSel, {
          visible: true, timeout: ppbUploadTimeout
        })

        // click preview
        await botSleep(1);
        await botSleep(1);
        await botClick("#print-preview-noconfirm-announce", page);

        //
        let saveAndContinue = "#save-and-continue-announce";

        // wait for result
        let _result = await waitforerrororsuccess(page, '#processing_error', '#printpreview_exit_button', ppbUploadTimeout);
        if (!_result) {
            configs.message = 'Lanch preview failed';
            return configs;
        } else {
            console.log('lanch preview success, check preview ok?');

            await botSleep(1);

            // if error
            if (await page.$('#error-header') != null) {
                // click exist preview
                await botSleep(2);
                await botClick("#printpreview_exit_button a", page);

                try {
                    await botSessionWaitfor(page, saveAndContinue, accTpl, 60000); // timeout 1 minutes
                } catch (error) {
                    console.log(error);
                    await waitForElement(page, saveAndContinue);
                }

                configs.message = 'Lanch preview failed';
                return configs;
            } else {
                await botSleep(2);
                await botClick("#printpreview_approve_button_enabled a", page);

                try {
                    await botSessionWaitfor(page, saveAndContinue, accTpl, 60000); // timeout 1 minutes
                } catch (error) {
                    console.log(error);
                    await waitForElement(page, saveAndContinue);
                }

                // click next step
                await botSleep(2);
                await botClick(saveAndContinue, page);
            }
        }
    } catch (error) {
        console.log(error);
        configs.message = "Step2 " + error.message ;
        return configs;
    }

    // last step
    try {
        let publicPPB = "#save-and-publish-announce";
        try {
            await botSessionWaitfor(page, publicPPB, accTpl, 60000); // timeout 1 minutes
        } catch (error) {
            console.log(error);
            await waitForElement(page, publicPPB);
        }

        // click worldwide if no selected countries
        let countries = u_config.countries;
        if (countries.length <= 0) {
            let worldwideSel = "#data-print-book-worldwide-rights-accordion a";
            await botSleep(1);
            await botClick(worldwideSel, page);
        } else {
            let individualSel = "#data-print-book-worldwide-rights-accordion .a-last a";
            await botSleep(1);
            await botClick(individualSel, page);
            await botSleep(1);

            // click all country
            let selectall = '#potter-territory-chooser-all';
            await botClick(selectall, page);
            await botSleep(1);

            for(let i = 0; i < countries.length; i++) {
                let country_id = "#" + countries[i].toLowerCase().replace('digital', 'print-book');
                try {
                    await botClick(country_id, page);
                    await botSleep(0);
                } catch {}
            }
        }

        // type price
        let price = u_config.price;
        await botSleep(1);
        await typeEmptyInput(page, "#data-pricing-print-us-price-input input", price);
        await botSleep(1);

        // click final step
        await botSleep(1);
        await botSleep(1);
        await botClick("#save-and-publish-announce", page);
    } catch (error) {
        console.log(error);
        configs.message = "Step3 " + error.message ;
        return configs;
    }

    // wait for finish page
    try {
        let closeFinish = "#publish-confirm-popover-print-close input";
        await waitForElement(page, closeFinish);
        await botSleep(1);
        await botClick(closeFinish, page);
    } catch {
        // reload page
        await page.evaluate(() => {
           location.reload(true)
        })
    }

    // upload success
    configs.upload = true;
    configs.message = "Upload paperback success";

    return configs;
}

async function botUploadEbook(page, configs, u_config, path_file, u_data, log, accTpl) {
    // init 
    configs.upload = false; // set success upload to false;

    try {
        // eBook button wait for
        let eBookBtn = '#create-digital-button';
        await botSessionWaitfor(page, eBookBtn, accTpl, 60000);

        // click submit new ebook
        await botSleep(1);
        await botSleep(1);
        await botClick(eBookBtn, page); 

        let tabDetails = "#book-setup-navigation-bar-details-link";
        await botSessionWaitfor(page, tabDetails, accTpl, 60000);

        await botSleep(1);
    } catch (error) {
        configs.message = "go to ebook step1 " + error.message ;
        return configs;
    }

    try {
        console.log("start fill infos");

        // start fill infos
        let titleInput = "#data-title";
        let subtitleInput = "#data-subtitle";
        let seriesNameInput = "#data-series-title";
        let seriesNumberInput = "#data-series-number";
        let authorFirstInput = "#data-primary-author-first-name";
        let authorLastInput = "#data-primary-author-last-name";

        // remove special character
        let titleText = u_data[2].replace(/(\r\n|\n|\r)/gm, "");

        // wait for categories shown
        await waitForElement(page, titleInput); 
        await botSleep(1);

        // type input
        if (u_data[2]) { let titleText = u_data[2].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, titleInput, titleText); }
        if (u_data[3]) { let subtitleText = u_data[3].replace(/(\r\n|\n|\r)/gm, ""); await pasteInput(subtitleText, subtitleInput, page); }
        
        try {
            if (u_data[4]) { let seriesNameText = u_data[4].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, seriesNameInput, seriesNameText); }
            if (u_data[5]) { let seriesNumberText = u_data[5].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, seriesNumberInput, seriesNumberText); }
        } catch (error) {
            console.log(error);
        }

        try {
            if (u_data[7]) { let authorFirstText = u_data[7].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, authorFirstInput, authorFirstText); }
            if (u_data[8]) { let authorLastText = u_data[8].replace(/(\r\n|\n|\r)/gm, ""); await typeEmptyInput(page, authorLastInput, authorLastText); }
        } catch (error) {
            console.log(error);
        }

        // type description
        if (u_data[6] != "") {
            /* let description = u_data[6];
            await botSleep(1);
            await page.click("#data-description"); await botSleep(0);
            await page.evaluate((description) => document.querySelector("#data-description").value = description, description);
            */
            /*let description = u_data[6];
            await pasteInput(description, ".cke_contents_ltr", page);*/
            // tab 7 times
            await page.keyboard.press('Tab'); await botSleep(0);
            await page.keyboard.press('Tab'); await botSleep(0);
            await page.keyboard.press('Tab'); await botSleep(0);
            await page.keyboard.press('Tab'); await botSleep(0);
            await page.keyboard.press('Tab'); await botSleep(0);
            await page.keyboard.press('Tab'); await botSleep(0);
            await page.keyboard.press('Tab'); await botSleep(0);

            // type description
            let description = u_data[6];
            await page.keyboard.type(description);
        }

        // click copy rights
        await botSleep(1);
        let copyrightSetting = u_config.owner_or_public_domain;
        if (copyrightSetting == "Public domain") {
            await botClick("#public-domain", page);
        } else {
            await botClick("#non-public-domain", page);
        }

        // type keywords
        let countKeyword = 0;
        let maxKeywords = 7;
        if (u_data[9] != "") {
            let strArr = u_data[9].split(',');
            if (strArr.length > 0) {
                for( let word of strArr) {
                    let r_word = (word.substr(0,1) == " ") ? word.substr(1) : word;
                    r_word = r_word.replace(/(\r\n|\n|\r)/gm, "");
                    
                    if (countKeyword < maxKeywords) {
                        // type keyword
                        let keywordInput = "#data-keywords-" + countKeyword;
                        // await typeEmptyInput(page, keywordInput, r_word);
                        await pasteInput(r_word, keywordInput, page);

                        countKeyword++;
                    } else {
                        break;
                    }
                }
            }
        } 

        // select categories
        let categories = u_config.categories;
        await botSleep(1);
        let showCatBtn = "#data-categories-button-proto-announce";
        await botClick(showCatBtn, page);

        // wait for categories shown
        await waitForElement(page, showCatBtn); 

        let catSelectors = {
            'fiction': '#icon-fiction',
            'fiction_childrens': {
                "General": "#checkbox-fiction_general",
                "Action & Adventure": "#checkbox-fiction_action-and-adventure",
                "Classics": "#checkbox-fiction_classics",
                "Erotica": "#checkbox-fiction_erotica",
                "Fairy Tales, Folk Tales, Legends & Mythology": "#checkbox-fiction_fairy-tales-folk-tales-legends-and-mythology",
                "Ghost": "#checkbox-fiction_ghost",
                "Horror": "#checkbox-fiction_horror",
                "Humorous": "#checkbox-fiction_humorous",
                "Short Stories": "#checkbox-fiction_short-stories-single-author",
                "Sports": "#checkbox-fiction_sports",
                "Superheroes": "#checkbox-fiction_superheroes",
                "Fantasy": {
                    "Expand": "#icon-fiction_fantasy",
                    "General": "#checkbox-fiction_fantasy_general",
                    "Dark Fantasy": "#checkbox-fiction_fantasy_dark-fantasy",
                    "Epic": "#checkbox-fiction_fantasy_epic",
                    "Historical": "#checkbox-fiction_fantasy_historical",
                    "Paranormal": "#checkbox-fiction_fantasy_paranormal",
                    "Urban": "#checkbox-fiction_fantasy_urban"
                },
                "Mystery & Detective": {
                    "Expand": "#icon-fiction_mystery-and-detective",
                    "General": "#checkbox-fiction_mystery-and-detective_general"
                },
                "Science Fiction": {
                    "Expand": "#icon-fiction_science-fiction",
                    "General": "#checkbox-fiction_science-fiction_general",
                    "Action & Adventure": "#checkbox-fiction_science-fiction_action-and-adventure",
                    "Space Opera": "#checkbox-fiction_science-fiction_space-opera"
                },
                "Thrillers": {
                    "Expand": "#icon-fiction_thrillers",
                    "General": "#checkbox-fiction_thrillers_general",
                    "Supernatural": "#checkbox-fiction_thrillers_supernatural"
                },
                "Romance": {
                    "Expand": "#icon-fiction_romance",
                    "General": "#checkbox-fiction_romance_general",
                    "Collections & Anthologies": "#checkbox-fiction_romance_collections-and-anthologies",
                    "Erotica": "#checkbox-fiction_romance_erotica",
                    "Fantasy": "#checkbox-fiction_romance_fantasy",
                    "Gay": "#checkbox-fiction_romance_gay",
                    "New Adult": "#checkbox-fiction_romance_new-adult",
                    "Paranormal": "#checkbox-fiction_romance_paranormal",
                    "Romantic Comedy": "#checkbox-fiction_romance_romantic-comedy",
                    "Science Fiction": "#checkbox-fiction_romance_science-fiction",
                },
                "Sagas": "#checkbox-fiction_sagas",
                "Urban": "#checkbox-fiction_urban"
            },
            'juvenile_fiction': '#icon-juvenile-fiction',
            'juvenile_fiction_childrens': {
                "Activity Book": "#checkbox-juvenile-fiction_activity-books",
                "Fantasy & Magic": "#checkbox-juvenile-fiction_fantasy-and-magic",
                "Monsters": "#checkbox-juvenile-fiction_monsters",
                "Mysteries & Detective Stories": "#checkbox-juvenile-fiction_mysteries-and-detective-stories",
                "Nursery Rhymes": "#checkbox-juvenile-fiction_nursery-rhymes",
                "Picture Books": "#checkbox-juvenile-fiction_picture-books",
                "Robots": "#checkbox-juvenile-fiction_robots",
                "Short Stories": "#checkbox-juvenile-fiction_short-stories",
                "Action & Adventures": {
                    "Expand": "#icon-juvenile-fiction_action-and-adventure",
                    "General": "#checkbox-juvenile-fiction_action-and-adventure_general"
                },
                "Comics & Graphic Novels": {
                    "Expand": "#icon-juvenile-fiction_comics-and-graphic-novels",
                    "General": "#checkbox-juvenile-fiction_comics-and-graphic-novels_general",
                    "Manga": "#checkbox-juvenile-fiction_comics-and-graphic-novels_manga",
                    "Media Tie In": "#checkbox-juvenile-fiction_comics-and-graphic-novels_media-tie--in",
                    "Superheroes": "#checkbox-juvenile-fiction_comics-and-graphic-novels_superheroes"
                },
                "Concepts": {
                    "Expand": "#icon-juvenile-fiction_concepts",
                    "General": "#checkbox-juvenile-fiction_concepts_general",
                    "Alphabets": "#checkbox-juvenile-fiction_concepts_alphabet",
                    "Body": "#checkbox-juvenile-fiction_concepts_body",
                    "Colors": "#checkbox-juvenile-fiction_concepts_colors",
                    "Counting Numbers": "#checkbox-juvenile-fiction_concepts_counting-and-numbers",
                    "Date & Time": "#checkbox-juvenile-fiction_concepts_date-and-time",
                    "Season": "#checkbox-juvenile-fiction_concepts_seasons",
                    "Sound": "#checkbox-juvenile-fiction_concepts_sounds",
                    "Words": "#checkbox-juvenile-fiction_concepts_words",
                },
                "Fairy Tales & Folklore": {
                    "Expand": "#icon-juvenile-fiction_fairy-tales-and-folklore",
                    "General": "#checkbox-juvenile-fiction_fairy-tales-and-folklore_general"
                },
                "Readers": {
                    "Expand": "#icon-juvenile-fiction_readers",
                    "Beginner": "#checkbox-juvenile-fiction_readers_beginner",
                    "Chapter Books": "#checkbox-juvenile-fiction_readers_chapter-books",
                    "Intermediate": "#checkbox-juvenile-fiction_readers_intermediate"
                },
            },
            'comics_grapic_novels': '#icon-comics-and-graphic-novels',
            'commic_childrens': {
                "General": "#checkbox-comics-and-graphic-novels_general",
                "Adaptations": "#checkbox-comics-and-graphic-novels_adaptations",
                "Anthologies": "#checkbox-comics-and-graphic-novels_anthologies",
                "Contemporary Womem": "#checkbox-comics-and-graphic-novels_contemporary-women",
                "Crime & Mystery": "#checkbox-comics-and-graphic-novels_crime-and-mystery",
                "Erotica": "#checkbox-comics-and-graphic-novels_erotica",
                "Fantasy": "#checkbox-comics-and-graphic-novels_fantasy",
                "Historical Fiction": "#checkbox-comics-and-graphic-novels_historical-fiction",
                "Horror": "#checkbox-comics-and-graphic-novels_horror",
                "LGBT": "#checkbox-comics-and-graphic-novels_lgbt",
                "Literary": "#checkbox-comics-and-graphic-novels_literary",
                "Media Tie-In": "#checkbox-comics-and-graphic-novels_media-tie--in",
                "Nonfiction": "#checkbox-comics-and-graphic-novels_nonfiction",
                "Religious": "#checkbox-comics-and-graphic-novels_religious",
                "Romance": "#checkbox-comics-and-graphic-novels_romance",
                "Science Fiction": "#checkbox-comics-and-graphic-novels_science-fiction",
                "Superheroes": "#checkbox-comics-and-graphic-novels_superheroes",
                'Manga': {
                    "Expand": "#icon-comics-and-graphic-novels_manga",
                    "General": "#checkbox-comics-and-graphic-novels_manga_general",
                    "Adult Comics": "#checkbox-comics-and-graphic-novels_manga_adult-comics",
                    "Boy's Love Comics": "#checkbox-comics-and-graphic-novels_manga_boys-love-comics",
                    "Crime & Mystery": "#checkbox-comics-and-graphic-novels_manga_crime-and-mystery",
                    "Erotica": "#checkbox-comics-and-graphic-novels_manga_erotica",
                    "Fantasy": "#checkbox-comics-and-graphic-novels_manga_fantasy",
                    "Historical Fiction": "#checkbox-comics-and-graphic-novels_manga_historical-fiction",
                    "Horror": "#checkbox-comics-and-graphic-novels_manga_horror",
                    "Illustrations & Fanbooks": "#checkbox-comics-and-graphic-novels_manga_illustrations-and-fanbooks",
                    "Josei Manga": "#checkbox-comics-and-graphic-novels_manga_josei-manga",
                    "LGBT": "#checkbox-comics-and-graphic-novels_manga_lgbt",
                    "Media Tie-In": "#checkbox-comics-and-graphic-novels_manga_media-tie--in",
                    "Nonfiction": "#checkbox-comics-and-graphic-novels_manga_nonfiction",
                    "Romance": "#checkbox-comics-and-graphic-novels_manga_romance",
                    "Science Fiction": "#checkbox-comics-and-graphic-novels_manga_science-fiction",
                    "Science Manga": "#checkbox-comics-and-graphic-novels_manga_seinen-manga",
                    "Shonen Manga": "#checkbox-comics-and-graphic-novels_manga_shonen-manga",
                    "Shoujo Manga": "#checkbox-comics-and-graphic-novels_manga_shoujo-manga",
                    "Sports": "#checkbox-comics-and-graphic-novels_manga_sports",
                    "Yaoi Manga": "#checkbox-comics-and-graphic-novels_manga_yaoi"
                }
            }
        };

        let count_cat = 0;
        let maximum_cat = 2;

        // check comic 
        if (categories.comics_grapic_novels.length > 0) {
            // expand comic
            let expandSel = catSelectors.comics_grapic_novels;
            await waitForElement(page, expandSel); await botClick(expandSel, page);

            for(let comic_cat of categories.comics_grapic_novels) {
                if (comic_cat.child.length == 0) { // if last tree, check
                    // wait for this child then click
                    let checkboxSel = catSelectors.commic_childrens[comic_cat.item];
                    if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                    
                } else {
                    // expand this parents
                    expandSel = catSelectors.commic_childrens[comic_cat.item].Expand;
                    await waitForElement(page, expandSel); await botClick(expandSel, page);

                    for(let comic_cat_child of comic_cat.child) {
                        if (comic_cat_child.child.length == 0) { // if last tree, check
                            // wait for this child then click
                            let checkboxSel = catSelectors.commic_childrens[comic_cat.item][comic_cat_child.item];
                            if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                        }
                    }
                }
            }
        }

        // check fiction 
        if (categories.fiction.length > 0) {
            // expand comic
            let expandSel = catSelectors.fiction;
            await waitForElement(page, expandSel); await botClick(expandSel, page);

            for(let fiction_cat of categories.fiction) {
                if (fiction_cat.child.length == 0) { // if last tree, check
                    // wait for this child then click
                    let checkboxSel = catSelectors.fiction_childrens[fiction_cat.item];
                    if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                    
                } else {
                    // expand this parents
                    expandSel = catSelectors.fiction_childrens[fiction_cat.item].Expand;
                    await waitForElement(page, expandSel); await botClick(expandSel, page);

                    for(let fiction_cat_child of fiction_cat.child) {
                        if (fiction_cat_child.child.length == 0) { // if last tree, check
                            // wait for this child then click
                            let checkboxSel = catSelectors.fiction_childrens[fiction_cat.item][fiction_cat_child.item];
                            if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                        }
                    }
                }
            }
        }

        // check juvenile fiction 
        if (categories.juvenile_fiction.length > 0) {
            // expand comic
            let expandSel = catSelectors.juvenile_fiction;
            await waitForElement(page, expandSel); await botClick(expandSel, page);

            for(let juvenile_fiction_cat of categories.juvenile_fiction) {
                if (juvenile_fiction_cat.child.length == 0) { // if last tree, check
                    // wait for this child then click
                    let checkboxSel = catSelectors.juvenile_fiction_childrens[juvenile_fiction_cat.item];
                    if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                    
                } else {
                    // expand this parents
                    expandSel = catSelectors.juvenile_fiction_childrens[juvenile_fiction_cat.item].Expand;
                    await waitForElement(page, expandSel); await botClick(expandSel, page);

                    for(let juv_fiction_cat_child of juvenile_fiction_cat.child) {
                        if (juv_fiction_cat_child.child.length == 0) { // if last tree, check
                            // wait for this child then click
                            let checkboxSel = catSelectors.juvenile_fiction_childrens[juvenile_fiction_cat.item][juv_fiction_cat_child.item];
                            if (count_cat < maximum_cat) { await waitForElement(page, checkboxSel); await botClick(checkboxSel, page); count_cat++; } else {break;}
                        }
                    }
                }
            }
        }

        // click save
        await botSleep(1);
        await botClick("#category-chooser-ok-button", page);

        // change age range
        let age_range = u_config.age_children;
        if (age_range != "0") {
            await botSleep(1);
            
            // click minimum selectbox
            await page.$eval('#data-reading-interest-age-start-input', (el) => el.scrollIntoView());
            await botSleep(1);
            
            await botClick("#data-reading-interest-age-start-input span span", page);
            await botSleep(1);

            // click selection
            let selectSel = "#data-reading-interest-age-start-input-native_" + (parseInt(age_range) + 1);
            await botClick(selectSel, page);

            if (age_range != "18") { // select maximum
                await botSleep(1);

                await botClick("#data-reading-interest-age-end-input span span", page);
                await botSleep(1);

                // click 18+ selection
                if (age_range == "13") {
                    await botClick("#data-reading-interest-age-end-input-native_6", page);
                }

                if (age_range == "16") {
                    await botClick("#data-reading-interest-age-end-input-native_3", page);
                }
            }
        }

        // click next step
        await botSleep(1);
        await botSleep(1);
        await botClick("#save-and-continue-announce", page);
    } catch (error) {
        console.log(error);
        configs.message = "Step1 " + error ;
        return configs;
    }

    try {
        // click rights management (DRM) 
        let drmSel = "#data-is-drm input";

        try {
            await botSessionWaitfor(page, drmSel, accTpl, 60000); // timeout 1 minutes
        } catch (error) {
            console.log(error);
            await waitForElement(page, drmSel);
        }
        
        await botSleep(1);
        await botClick(drmSel, page);

        // check upload local book cover
        let localCoverSel = "#data-cover-choice-accordion .a-last .a-accordion-radio";
        await botSleep(1);
        await botClick(localCoverSel, page);

        // upload cover file
        let uploadCoverInput = "#data-assets-cover-file-upload-AjaxInput";
        try {
            let uploadCoverBtn = await page.$(uploadCoverInput);
            let cover_path = path_file + '/' + u_data[1];

            if (!fs.existsSync(cover_path)) {
                configs.message = "Cover file is not exist!" ;
                return configs;
            }

            // console.log(design_path);
            await uploadCoverBtn.uploadFile(cover_path);
        } catch(error){ 
            configs.message = error.message ;
            return configs;
        }

        // wait for upload success
        let kdpUploadTimeout = u_config.uploadTimeout * 60000;
        let reuploadTimer = u_config.reuploadTimer * 60000;
        let uploadCoverSuccessSel = "#data-assets-cover-file-upload-success";
        await page.waitForSelector(uploadCoverSuccessSel, {
          visible: true, timeout: kdpUploadTimeout
        })

        await botSleep(5000);

        // try to upload 3 times per reuploadTimer minutes
        let kdp_upload_time = 0;
        while(kdp_upload_time < 5) {
            // upload ebook
            let uploadBookInput = "#data-assets-interior-file-upload-AjaxInput";
            try {
                let uploadBookBtn = await page.$(uploadBookInput);
                let book_path = path_file + '/' + u_data[0];

                if (!fs.existsSync(book_path)) {
                    configs.message = "EBook file is not exist!" ;
                    return configs;
                }

                // console.log(design_path);
                await uploadBookBtn.uploadFile(book_path);

                // click continue with pdf file
                try {
                    let continuePDF = "#file-warn-extension-continue-announce";
                    await waitForElement(page, continuePDF, 10000);
                    if (await page.$(continuePDF) != null) {
                        await botClick(continuePDF, page);
                    }
                } catch {}
            } catch(error){ 
                configs.message = error.message ;
                return configs;
            }

            try {
                // wait for upload success
                let uploadBookSuccessSel = "#data-assets-interior-file-upload-success";
                await page.waitForSelector(uploadBookSuccessSel, {
                  visible: true, timeout: reuploadTimer
                })

                // if upload success then break
                // break;
                kdp_upload_time = 99; // > 3 --> break
            } catch (error){
                console.log(error);
                kdp_upload_time++;

                // try to click cancel upload if has
                try {
                    // uploading-popover-cancel-button
                    // await botClick("#uploading-popover-cancel-button", page);

                    // await botSleep(1);

                    // reload page
                    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

                    await waitForElement(page, uploadBookInput);
                    await botSleep(1);
                } catch {}

                // 
                await botSleep(2);
            }
        }

        // wait for complete
        // click next step
        await botSleep(1);
        await botSleep(1);
        await botClick("#save-and-continue-announce", page);

        // check error
        await botSleep(3000);
        if (await page.$("#interior-status-field .was-invisible") != null) {
            let _error = await page.evaluate(el => el.innerHTML, await page.$('#interior-status-field-error .a-alert-content'));
            configs.message = _error;
            return configs;
        }
    } catch (error) {
        console.log(error);
        configs.message = "Step2 " + error.message ;
        return configs;
    }

    // last step
    try {
        let enrollmentSel = "#data-is-select";
        try {
            let generateTimeout = u_config.uploadTimeout * 60000;
            await botSessionWaitfor(page, enrollmentSel, accTpl, generateTimeout); // timeout 30 minutes
        } catch (error) {
            console.log(error);
            await waitForElement(page, enrollmentSel);
        }

        // click enrollment
        await botSleep(2);
        await botClick(enrollmentSel, page);

        // click worldwide if no selected countries
        let countries = u_config.countries;
        if (countries.length <= 0) {
            let worldwideSel = "#data-digital-worldwide-rights-accordion a";
            await botSleep(1);
            await botClick(worldwideSel, page);
        } else {
            let individualSel = "#data-digital-worldwide-rights-accordion .a-last a";
            await botSleep(1);
            await botClick(individualSel, page);
            await botSleep(1);

            // click all country
            let selectall = '#potter-territory-chooser-all';
            await botClick(selectall, page);
            await botSleep(1);

            for(let i = 0; i < countries.length; i++) {
                let country_id = "#" + countries[i];
                try {
                    await botClick(country_id, page);
                    await botSleep(0);
                } catch {}
            }
        }

        try {
            let royalty_plan = u_config.royalty_plan;
            if (royalty_plan == "35") {
                // click 35%
                let secondInput = await getSelector(page, "#data-digital-royalty-rate input", 0);
                await botSleep(1);
                await clickElement(secondInput, page);
            } else {
                // click 70%
                let secondInput = await getSelector(page, "#data-digital-royalty-rate input", 1);
                await botSleep(1);
                await clickElement(secondInput, page);
            }
        } catch {
            // click 70%
            let secondInput = await getSelector(page, "#data-digital-royalty-rate input", 1);
            await botSleep(1);
            await clickElement(secondInput, page);
        }

        // type price
        let price = u_config.price;
        await botSleep(1);
        await typeEmptyInput(page, "#data-digital-us-price-input input", price);
        await botSleep(1);

        // book lending
        let bookLending = "#data-is-book-lending";
        await botSleep(1);
        await botClick(bookLending, page);

        // click final step
        await botSleep(1);
        await botSleep(1);
        await botClick("#save-and-publish-announce", page);
    } catch (error) {
        console.log(error);
        configs.message = "Step3 " + error.message ;
        return configs;
    }

    // wait for finish page
    try {
        let closeFinish = "#publish-confirm-popover-digital-close";
        await waitForElement(page, closeFinish);
        await botSleep(1);
        await botClick(closeFinish, page);
    } catch {
        // reload page
        await page.evaluate(() => {
           location.reload(true)
        })
    }

    // upload success
    configs.upload = true;
    configs.message = "Upload ebook success";

    return configs;
}

async function botUploadTshirt(page, configs, u_config, u_data, ddlTypes, log) {
    // init 
    configs.upload = false;

    //
    let typeObj = {
        deLanguage: false,
        slotFull: false,
        designUploaded: 0,
        availableUpload1: null,
        availableUpload2: null
    }

    if (await templateNotExist(page)) {
        console.log('template is not exist');
        if (u_config.merch_template == 2) { // break if set using save_template option but don't have any template anymore!
            configs.stop = true;
            configs.message = "No template was set by user.";

            return configs;
        }
    }

    if (u_config.merch_template == 0 || (configs.first_upload && u_config.merch_template == 1)) {
        // check and delete old template
        if (await templateNotExist(page)) {} else {
            let deleteTemplate = await deleteOldTemplate(page);

            if (!deleteTemplate) {
                configs.message = "Failed to delete old template.";

                return configs;
            }

            // reload page after delete old template
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

            await page.waitForSelector('#select-marketplace-button', {timeout: 60000}).then(async() => {
            }).catch(() => {
                configs.message = "Reload page after delete template timeout.";

                return configs;
            });
        }

        // select type
        typeObj = await selectType(page, u_config, ddlTypes, configs.maximum);

        if (!typeObj.status) {
            configs.message = "Failed to select product type.";
            return configs;
        }

        // set hasto save template
        if (u_config.merch_template != 0) {
            configs.save_template = true;
        }

        // setup products
        let setup_status = await setupProduct(page, u_config, ddlTypes, configs.maximum);

        if (!setup_status.status) {
            configs.message = setup_status.message;

            return configs;
        }
    } else {
        // define upload buttons
        typeObj = await defineSavedTemplate(page, u_config, ddlTypes, configs.maximum);
    }

    // save template here
    if (configs.save_template) {
        let _return = await saveTemplate(page);

        if (_return) {
            configs.save_template = false;
        }
    }

    // upload designs
    let path_file = u_config.path_file.replace(/\\/g,"/");
    let uploadImagesReturn = await uploadDesigns(page, ddlTypes, path_file, u_data, typeObj.availableUpload1, typeObj.availableUpload2, u_config.print);

    if (uploadImagesReturn.status) {
        // fill infos
        let invalidText = await fillProductInfos(page, u_config, u_data, typeObj.deLanguage);

        if (invalidText != null) { // if valid infos
            configs.message = invalidText;
        } else {
            // after fill infos success, check image upload error
            let checkUpload = await waitForUploadSuccess(page);

            if (checkUpload.status) {
                // click submit
                await botClick("#submit-button", page);
                await botSleep(1);

                if (await page.$('.btn-submit') == null) {
                    await botSleep(3000);
                }
                await botClick('.btn-submit', page);
                await botSleep(1);

                await page.waitForSelector('#status-filter', {timeout: 60000}).then(async() => {
                }).catch(() => {
                    console.log("Wait for success page timeout.");
                });

                // if success upload, set configs.first_upload to false
                configs.first_upload = false;

                // set upload success to true
                configs.upload = true;

                // decrease maximum upload
                configs.maximum = configs.maximum - typeObj.designUploaded;
            } else {
                configs.message = checkUpload.message;

                if(checkUpload.stop) {
                    configs.stop = true;
                }
            }
        }
    } else {
        configs.message = uploadImagesReturn.message;
    }

    // if full slot after this upload
    if (typeObj.slotFull) {
        configs.stop = true;
        configs.message = "This account has 0 slot.";
    }

    return configs;
}

async function initTemplate(page, first_upload, use_template) {
    console.log('init template');
    if (use_template == 0 || (first_upload && use_template == 1)) {
        // remove current template
        let deleteSel = '.delete-setting-group-link';
        let submitDelete = '#delete-button';
        let selWaitfor = '#select-marketplace-button';

        try {
            if (await page.$(deleteSel) != null) {
                await page.click(deleteSel);

                await page.waitForSelector(submitDelete, {timeout: 30000});
                await botSleep(1);
                await page.click(submitDelete);
                await botSleep(1);

                // reload page
                await page.evaluate(() => {
                   location.reload(true)
                })

                await botSleep(1);
            }
        } catch (error) {
            console.log(error);
        }
    }
}

async function templateNotExist(page) {
    let deleteSel = '.delete-setting-group-link';
    if (await page.$(deleteSel) == null) {
        return true;
    } else {
        return false;
    }
}

async function deleteOldTemplate(page) {
    console.log('delete old template');
    try {
        let deleteSel = '.delete-setting-group-link';
        await botClick(deleteSel, page);
        await botSleep(1);

        if (await page.$('#delete-button') == null) {
            await botSleep(3000);
        }

        await botClick('#delete-button', page);

        await botSleep(1);

        return true;
    } catch {
        return false;
    }
}

async function selectType(page, u_config, ddlTypes, maximum) {
    let _status = true;

    let deLanguage = false;
    let slotFull = false;

    let btnSel = '#select-marketplace-button';
    await botClick(btnSel, page);

    await botSleep(1);

    // get available type to upload designs
    let count_design = 0;
    let availableUpload1 = null;
    let availableUpload2 = null;

    if (await page.$('#select-all-products') != null) {
        let firstRow = await getSelector(page, '.modal-body .form-row', 0);
        let deselectAll = await firstRow.$('flowcheckbox');
        await clickElement(deselectAll, page); await botSleep(1); await clickElement(deselectAll, page); await botSleep(0);

        let ddlApparel = u_config.ddlApparel;
        if(ddlApparel.length > 0) {
            for(let i = 0; i < ddlApparel.length; i++) {
                try {
                    let markets = u_config[ddlTypes[ddlApparel[i]].market];
                    for(let market of markets) {
                        if(count_design < maximum) {
                            // start choose this
                            count_design++;

                            let _symbol = (market == 'en-gb') ? '-GB' : ((market == 'de-de') ? '-DE' : '-US');
                            let flowcheckbox = await page.$('.' + ddlTypes[ddlApparel[i]].class + _symbol);
                            await clickElement(flowcheckbox, page);
                            await botSleep(0);

                            if(market == 'de-de') {
                                deLanguage = true;
                            }

                            // specify upload input
                            if (u_config.print == "front" && (ddlApparel[i] == "pullover-hoodie" || ddlApparel[i] == "zip-hoodie")) { // if hoodie front
                                if (availableUpload2 == null) { availableUpload2 = ddlApparel[i]; }
                            } else {
                                if (availableUpload1 == null) { availableUpload1 = ddlApparel[i]; }
                            }
                        } else {
                            slotFull = true;
                        }
                    }
                } catch(error) {
                    console.log(error);
                }
            }
        }

        // click submit
        await botSleep(1);
        let continueBtn = await page.$('.modal-footer .btn-submit');
        await clickElement(continueBtn, page);
    } else {
        _status = false;
    }

    return {
        status: _status,
        deLanguage: deLanguage,
        slotFull: slotFull,
        designUploaded: count_design,
        availableUpload1: availableUpload1,
        availableUpload2: availableUpload2
    };
}

async function defineSavedTemplate(page, u_config, ddlTypes, maximum) {
    let _status = true;

    let deLanguage = false;
    let slotFull = false;

    // get available type to upload designs
    let count_design = 0;
    let availableUpload1 = null;
    let availableUpload2 = null;

    let ddlApparel = u_config.ddlApparel;
        if(ddlApparel.length > 0) {
            for(let i = 0; i < ddlApparel.length; i++) {
                try {
                    let markets = u_config[ddlTypes[ddlApparel[i]].market];
                    for(let market of markets) {
                        if(count_design < maximum) {
                            // start choose this
                            count_design++;

                            if(market == 'de-de') {
                                deLanguage = true;
                            }

                            // specify upload input
                            if (u_config.print == "front" && (ddlApparel[i] == "pullover-hoodie" || ddlApparel[i] == "zip-hoodie")) { // if hoodie front
                                if (availableUpload2 == null) { availableUpload2 = ddlApparel[i]; }
                            } else {
                                if (availableUpload1 == null) { availableUpload1 = ddlApparel[i]; }
                            }
                        } else {
                            slotFull = true;
                        }
                    }
                } catch(error) {
                    console.log(error);
                }
            }
        }

    return {
        status: _status,
        deLanguage: deLanguage,
        slotFull: slotFull,
        designUploaded: count_design,
        availableUpload1: availableUpload1,
        availableUpload2: availableUpload2
    };
}

async function setupProduct(page, u_config, ddlTypes, maximum) {
    await botSleep(1);

    let error_log = null;

    let count_design = 0;
    let ddlApparel = u_config.ddlApparel;

    if(ddlApparel.length > 0) {
        for(let i = 0; i < ddlApparel.length; i++) {
            // check available design
            count_design++;

            if (count_design <= maximum) {
                // click edit details
                let editBtn = await page.$(ddlTypes[ddlApparel[i]].editbtn);
                await clickElement(editBtn, page);
                await botSleep(1);

                try {
                    // choose gender
                    let genders = u_config.gender;
                    if (genders.indexOf("0") == -1) {
                        // click men
                        let men_checkbox = await page.$('.men-checkbox'); await clickElement(men_checkbox, page); await botSleep(0);
                    }

                    if (genders.indexOf("1") == -1) {
                        // click men
                        let women_checkbox = await page.$('.women-checkbox'); await clickElement(women_checkbox, page); await botSleep(0);
                    }

                    if (genders.indexOf("2") != -1) {
                        // click men
                        let youth_checkbox = await page.$('.youth-checkbox'); await clickElement(youth_checkbox, page); await botSleep(0);
                    }
                } catch {
                    console.log('Unisex product');
                }

                try {
                    // select colors
                    let colorKey = ddlTypes[ddlApparel[i]].color;
                    if (colorKey != null) {
                        let colors = u_config[colorKey];
                        if (colors.length > 0) {
                            // remove black type color
                            let blackColor = await page.$('.black-checkbox');
                            if (colorKey == 'colors_raglan') {
                                blackColor = await page.$('.black_athletic_heather-checkbox');
                            }

                            await clickElement(blackColor, page);
                            await botSleep(0);

                            for(let color of colors) {
                                let selectColor = await page.$("." + color + "-checkbox");
                                await clickElement(selectColor, page);
                                await botSleep(0);
                            }
                        } else {
                            console.log('no color selected');
                        }
                    }
                } catch(error) {
                    console.log('No color selected' + error);
                }

                try {
                    // change price
                    let markets = u_config[ddlTypes[ddlApparel[i]].market];
                    let count_market = 0;
                    for(let market of markets) {
                        count_market++;

                        // if(count_market > 1 && count_design > maximum)
                        if (count_market > 1) {
                            count_design++;
                        }

                        if (count_market == 1 || count_design <= maximum) {
                            let _symbol = (market == 'en-gb') ? 'uk_' : ((market == 'de-de') ? 'de_' : '');
                            
                            let priceKey = ddlTypes[ddlApparel[i]].price + _symbol + "price";
                            let price = u_config[priceKey];
                            
                            if (price) {
                                // compare price then change price
                                // click tab
                                /*if (_symbol == 'uk_') {
                                    let uk_tab = await page.$(".GB-nav-link");
                                    await uk_tab.click();
                                    await botSleep(1);
                                }

                                if (_symbol == 'de_') {
                                    let de_tab = await page.$(".DE-nav-link");
                                    await de_tab.click();
                                    await botSleep(1);
                                }*/
                                let input_pos = (market == 'en-gb') ? 1 : ((market == 'de-de') ? 2 : 0);
                                let price_input = await getSelector(page, 'price-editor input', input_pos);

                                // get current price
                                let current_price = await page.evaluate(el => el.value, price_input);
                                console.log(current_price);
                                
                                // if price is different then set price
                                if (price != current_price) {
                                    await price_input.press('Control');
                                    await price_input.press('KeyA');
                                    await price_input.press('Control');

                                    for(let p in price) {
                                        // type every character
                                        let c = price.charAt(p);
                                        await price_input.type(c);
                                        await botSleep(0);
                                    }
                                }
                            }
                        }
                    }
                } catch(error) {
                    error_log = error.message;
                }

                try {
                    // select printing side
                    let print_side = u_config.print;
                    if (print_side == 'back') {
                        let back_btn = await page.$('.btn-BACK');
                        await clickElement(back_btn, page);
                        await botSleep(1);
                    } else {
                        // if zip hoodie (click front)
                        if (ddlApparel[i] == "zip-hoodie") {
                            let front_btn = await page.$('.btn-FRONT');
                            await clickElement(front_btn, page);
                            await botSleep(1);
                        }
                    }
                } catch {}
            }
        }
    }

    if (error_log != null) {
        return {
            status: false,
            message: error_log
        }
    }

    return {
        status: true
    }
}

async function saveTemplate(page) {
    // save template button
    try {
        let saveTemplateBtn = await page.$('#save-publish-settings');
        await clickElement(saveTemplateBtn, page);
        await botSleep(1);

        if (await page.$('#save-button') == null) {
            await botSleep(3000);
        }

        await botClick('#save-button', page);

        await botSleep(1);
        await botSleep(1);

        return true;
    } catch {
        return false;
    }
}

async function uploadDesigns(page, ddlTypes, path_file, data, avai1, avai2, print_side) {
    print_side = (print_side == "front") ? "FRONT" : "BACK";

    if (avai1 == null && avai2 == null) {
        return {status: false, message: "Upload button not found."};
    }

    if (avai1 != null) {
        if (data[0] == null) {
            return {status: false, message: "Data image1 is null."};
        }
    }

    if (avai2 != null) {
        if (data[1] == null) {
            return {status: false, message: "Data image2 is null."};
        }
    }

    if (avai1 != null) {
        let uploadBtnSel = ddlTypes[avai1].uploadbtn + print_side;
        console.log(uploadBtnSel);

        try {
            let uploadBtn = await page.$('#' + uploadBtnSel);
            let design_path = path_file + '/' + data[0];

            if (!fs.existsSync(design_path)) {
                return {status: false, message: "Data image1 is not exist."};
            }

            // console.log(design_path);
            await uploadBtn.uploadFile(design_path);
        } catch(error){ 
            return {status: false, message: error.message};
        }
    }

    if (avai2 != null) {
        let uploadBtnSel = ddlTypes[avai2].uploadbtn + print_side;
        console.log(uploadBtnSel);

        try {
            let uploadBtn = await page.$('#' + uploadBtnSel);
            let design_path = path_file + '/' + data[1];

            if (!fs.existsSync(design_path)) {
                return {status: false, message: "Data image2 is not exist."};
            }

            // console.log(design_path);
            await uploadBtn.uploadFile(design_path);
        } catch(error){ 
            return {status: false, message: error.message};
        }
    }

    return {status: true, message: "Uploading..."};
}

async function waitForUploadSuccess(page) {
    await botSleep(1);

    let _timeout = 20;

    while (_timeout > 0) {
        _timeout--;

        try {
            // if has any alert
            if (await page.$('.product-asset-uploader-container .alert-danger') != null) {
                let errorMgs = await page.evaluate(el => el.innerHTML, await page.$('.product-asset-uploader-container .alert-danger div'));
                return {status: false, message: errorMgs, stop: false};
            }

            if (await page.$('rate-limit .alert-danger .heading') != null) {
                let errorMgs = await page.evaluate(el => el.innerHTML, await page.$('rate-limit .alert-danger .heading'));
                return {status: false, message: errorMgs, stop: true};
            }

            // check upload ready
            let review_btn = await page.evaluate(el => el.disabled, await page.$("#submit-button"));
            if (!review_btn) {
                return {status: true, message: "upload is ready.", stop: false};
            } else {
                // DELAY 3 SECONDS
                await botSleep(3000);
            }
        } catch (error) {
            return {status: false, message: error.message, stop: false};
        }
    }

    return {status: false, message: "Upload timeout.", stop: false};
}

async function fillProductInfos(page, u_config, data, deLanguage) {
    await botSleep(1);

    let title_input = '#designCreator-productEditor-title';
    let brand_input = '#designCreator-productEditor-brandName';
    let key1_input = '#designCreator-productEditor-featureBullet1';
    let key2_input = '#designCreator-productEditor-featureBullet2';
    let desc_input = '#designCreator-productEditor-description';

    let data_title = (data[2] != undefined) ? data[2] : '';
    let data_brand = (data[3] != undefined) ? data[3] : '';
    let data_key1 = (data[4] != undefined) ? data[4] : '';
    let data_key2 = (data[5] != undefined) ? data[5] : '';
    let data_desc = (data[6] != undefined) ? data[6] : '';

    // start type
    await typeEmptyInput(page, brand_input, data_brand);
    await typeEmptyInput(page, title_input, data_title);
    await typeEmptyInput(page, key1_input, data_key1);
    await typeEmptyInput(page, key2_input, data_key2);
    await typeEmptyInput(page, desc_input, data_desc);
    await page.keyboard.press('Tab'); await botSleep(1);

    let invalidSel = 'product-text-editor .invalid-feedback';
    let invalidText = null;
    if (await page.$(invalidSel) != null) {
        invalidText = await page.evaluate(el => el.innerHTML, await page.$(invalidSel));
        let invalidDefine = await page.evaluate(el => el.value, await page.$('.is-invalid'));
        invalidText = invalidText + ' (' + invalidDefine + ')';
    }

    if (invalidText != null) { return invalidText; }

    if (deLanguage) {
        let germanTab = await getSelector(page, '.product-detail-area a.nav-link', 1);
        await clickElement(germanTab, page); await botSleep(1);

        data_title = (data[7] != undefined) ? data[7] : data_title;
        data_brand = (data[8] != undefined) ? data[8] : data_brand;
        data_key1 = (data[9] != undefined) ? data[9] : data_key1;
        data_key2 = (data[10] != undefined) ? data[10] : data_key2;
        data_desc = (data[11] != undefined) ? data[11] : data_desc;

        // start type
        await typeEmptyInput(page, brand_input, data_brand);
        await typeEmptyInput(page, title_input, data_title);
        await typeEmptyInput(page, key1_input, data_key1);
        await typeEmptyInput(page, key2_input, data_key2);
        await typeEmptyInput(page, desc_input, data_desc);
        await page.keyboard.press('Tab'); await botSleep(1);

        if (await page.$(invalidSel) != null) {
            invalidText = await page.evaluate(el => el.innerHTML, await page.$(invalidSel));
            let invalidDefineDe = await page.evaluate(el => el.value, await page.$('.is-invalid'));
            invalidText = invalidText + ' (' + invalidDefineDe + ')';
        }
    }

    return invalidText;
}
/* ================== Upload Functions ==================== */
/* ================== Checksale Functions ==================== */
const SaleFuncs = {
    fastCheck: (async(page) => {}),
    normalCheck: (async(browser, page, acc) => {
        let todayDate = new Date();
        let dateStr = getDateString(todayDate);

        let saleObj = {
            Order: {},
            KenpRead: {},
            Royalties: {},
            Date: dateStr
        };

        // await page load success
        let reportLink = '.account-incomplete-new .a-alert-content .a-link-normal';
        // await waitForElement(page, reportLink); 
        await botSessionWaitfor(page, reportLink, acc);

        console.log('load page success');

        // click beta report
        await botSleep(1);
        await botClick(reportLink, page);

        // new page handle
        const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
        const newPage = await newPagePromise;

        // wait for report page
        await botSessionWaitfor(newPage, '.dashboard-daily-metric', acc);
        /*await newPage.waitForSelector('.dashboard-daily-metric', {timeout: 30000}).then(async() => {
        }).catch(() => {
            status.message = "Wait for report page timeout";
        });*/

        await botSleep(1);

        try {
            let kenpReadSeletor = await getSelector(newPage, ".dashboard-daily-metric .value", 2);
            let royalSeletor = await getSelector(newPage, ".dashboard-daily-metric .value", 0);
            let orderSeletor = await getSelector(newPage, ".dashboard-daily-metric .value", 1);
            

            let todayRoyalties = await newPage.evaluate(el => el.innerHTML, royalSeletor);
            let todayOrder = await newPage.evaluate(el => el.innerHTML, orderSeletor);
            let todayKenpRead = await newPage.evaluate(el => el.innerHTML, kenpReadSeletor);

            saleObj.Order.Today = todayOrder;
            saleObj.KenpRead.Today = todayKenpRead;
            saleObj.Royalties.Today = todayRoyalties;
        } catch {
            saleObj.Order.Today = 0;
            saleObj.KenpRead.Today = 0;
            saleObj.Royalties.Today = 0;
        }

        // go to order report
        let orderMenu = await getSelector(newPage, ".menu a.item", 1);
        await orderMenu.click();

        let generalSel = '.dashboard-container-content .header.large';
        await waitForElement(newPage, generalSel); 
        await botSleep(0);

        for(let i = 0; i < 3; i++) {
            /*await botClick('.aa-sales-page-date-selector-dropdown input', newPage);
            await botSleep(1);

            let selectRange = await getSelector(newPage, '.ranges.option-type-container a', i);
            await selectRange.click();*/
            // select daterange
            await botClick('.date-selector-dropdown', newPage);
            await botSleep(1);

            let selectRange = await getSelector(newPage, '.date-selector-menu .item', i);
            await selectRange.click();

            await waitForElement(newPage, generalSel);
            await botSleep(1);
            let orderValue = await newPage.evaluate(el => el.innerHTML, await newPage.$(generalSel));

            switch (i) {
                case 0: saleObj.Order.Last7days = orderValue; break;
                case 1: saleObj.Order.Last30days = orderValue; break;
                case 2: saleObj.Order.Last90days = orderValue; break;
            }

            await botSleep(1);
        }

        // go to kenp report
        let kenpMenu = await getSelector(newPage, ".menu a.item", 2);
        await kenpMenu.click();

        await waitForElement(newPage, generalSel); 
        await botSleep(0);

        for(let i = 0; i < 3; i++) {
            // select daterange
            await botClick('.date-selector-dropdown', newPage);
            await botSleep(1);

            if (i == 2) {i = 3}; // ignore last month - select last 90 days

            let selectRange = await getSelector(newPage, '.date-selector-menu .item', i);
            await selectRange.click();

            await waitForElement(newPage, generalSel);
            await botSleep(1);
            let kenp = await newPage.evaluate(el => el.innerHTML, await newPage.$(generalSel));

            switch (i) {
                case 0: saleObj.KenpRead.Last7days = kenp; break;
                case 1: saleObj.KenpRead.Last30days = kenp; break;
                case 2: saleObj.KenpRead.Last90days = kenp; break;
            }

            await botSleep(1);
        }

        // go to royalties report
        let royalMenu = await getSelector(newPage, ".menu a.item", 3);
        await royalMenu.click();

        // try to wait for royalty agreement first
        // .royalties-agreement-modal
        try {
            await waitForElement(newPage, '.royalties-agreement-modal', 10000);
            await botSleep(1);
            let settingsBtn = await newPage.$('.royalties-agreement-modal .action-button button');
            await clickElement(settingsBtn, newPage);

            await waitForElement(newPage, '#currency-dropdown_button_choice', 10000);
            await botSleep(1);
            let selectCur = await newPage.$('#currency-dropdown_button_choice');
            await clickElement(selectCur, newPage);
            await botSleep(1);
            let defaultCur = await newPage.$('#currency-dropdown_USD');
            await clickElement(defaultCur, newPage);
            await botSleep(1);

            // next settings
            let nextSettingsBtn = await getSelector(newPage, '.royalties-agreement-modal .action-button button', 0);
            await clickElement(nextSettingsBtn, newPage);
            await botSleep(2);

            // try
            try {
                await waitForElement(newPage, '#ppr-delta-dropdown_button_choice', 10000);
                await botSleep(1);
                let selectPpr = await newPage.$('#ppr-delta-dropdown_button_choice');
                await clickElement(selectPpr, newPage);
                await botSleep(1);
                let defaultPpr = await newPage.$('#ppr-delta-dropdown_1');
                await clickElement(defaultPpr, newPage);
                await botSleep(1);

                // save settings
                let saveSettingsBtn = await getSelector(newPage, '.royalties-agreement-modal .action-button button', 0);
                await clickElement(saveSettingsBtn, newPage);
                await botSleep(2);
            } catch {}
        } catch (error) {
            console.log(error);
            console.log('No royalty agreement popup');
        }

        await waitForElement(newPage, generalSel); 
        await botSleep(1);

        let thisMonthRoyalties = await newPage.evaluate(el => el.innerHTML, await newPage.$(generalSel));

        saleObj.Royalties.ThisMonth = thisMonthRoyalties;

        await botSleep(1);

        await botClick('.last-month-button', newPage);
        await waitForElement(newPage, generalSel); 
        await botSleep(1);

        let lastMonthRoyalties = await newPage.evaluate(el => el.innerHTML, await newPage.$(generalSel));
        saleObj.Royalties.LastMonth = lastMonthRoyalties;
        
        try {
            await botClick('.last-month-button.disabled', newPage);
            saleObj.Royalties.LastMonth = 'updating';
        } catch{}

        await botSleep(1);
        await newPage.close();

        return saleObj;
        // let bodyHtml = await newPage.evaluate(el => el.innerHTML, await newPage.$('body'));
        // console.log(bodyHtml);
    }),
    sevenCheck: (async(page) => {
        let dataArr = [];
        const dateRanges = prepare7DateRange();

        for (var i = 0; i < dateRanges.length; i++) {
            await filterByDateRange(page, dateRanges[i]);

            await botSleep(1);
            let dataListing = await getDataListing(page, true);

            dataArr.push({
                us: dataListing.us,
                uk: dataListing.uk,
                de: dataListing.de,
                date: dateRanges[i]._preStr
            });
        }

        return dataArr;
    }),
    designCheck: (async(page) => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        let todayDate = new Date();
        let tempToday = new Date();
        let yesDate = new Date(tempToday.setDate(tempToday.getDate() - 30));
        
        let monthRange = {
            startYear: yesDate.getFullYear(), startMonth: monthNames[yesDate.getMonth()], startDate: yesDate.getDate(),
            endYear: todayDate.getFullYear(), endMonth: monthNames[todayDate.getMonth()], endDate: todayDate.getDate(), _preStr: "30_days"
        };

        await filterByDateRange(page, monthRange);
        await botSleep(1);

        let dataListing = await getDataListing(page, true);

        return dataListing;
    }),
    manageCheck: (async(page) => {
        // pro_review / pro_process / pro_reject / pro_live / today_slot / total_slot
        await botSleep(1);
        await botClick("#status-filter button", page);
        await botSleep(0);

        // all checkbox
        let allCheckbox = await getSelector(page, '#status-filter flowcheckbox', 0);
        await clickElement(allCheckbox, page);

        await botSleep(0);

        // get review
        await botClick(".REVIEW-checkbox", page);
        await botSleep(1);
        await botSleep(1);
        //
        let filterText = await page.evaluate(el => el.innerHTML, await page.$('#products-shown-count'));
        let pro_review = filterText.split('of ')[1];
        console.log('pro_review', pro_review);

        await botSleep(0);
        await botClick(".PUBLISHING-checkbox", page);
        await botClick(".REVIEW-checkbox", page);
        await botSleep(1);
        await botSleep(1);

        filterText = await page.evaluate(el => el.innerHTML, await page.$('#products-shown-count'));
        let pro_process = filterText.split('of ')[1];
        console.log('pro_process', pro_process);

        await botSleep(0);
        await botClick(".AMAZON_REJECTED-checkbox", page);
        await botClick(".PUBLISHING-checkbox", page);
        await botSleep(1);
        await botSleep(1);

        filterText = await page.evaluate(el => el.innerHTML, await page.$('#products-shown-count'));
        let pro_reject = filterText.split('of ')[1];
        console.log('pro_reject', pro_reject);

        await botSleep(0);
        await botClick(".PUBLISHED-checkbox", page);
        await botClick(".AMAZON_REJECTED-checkbox", page);
        await botSleep(1); await botSleep(1);

        filterText = await page.evaluate(el => el.innerHTML, await page.$('#products-shown-count'));
        let pro_live = filterText.split('of ')[1];
        console.log('pro_live', pro_live);

        return {
            pro_live: pro_live,
            pro_review: pro_review,
            pro_process: pro_process,
            pro_reject: pro_reject
        };
    }),
    dashboardCheck: (async(page) => {
        await botSleep(1);

        let submissText = await page.evaluate(el => el.innerHTML, await page.$('#available-submissions-count'));
        let submiss = parseInt(submissText.replace(",",""));
        let publishedText = await page.evaluate(el => el.innerHTML, await page.$('#published-products-count'));
        let published = parseInt(publishedText.replace(",",""));
        let tierText = await page.evaluate(el => el.innerHTML, await page.$('#tier-count'));
        let tier = parseInt(tierText.replace(",",""));

        let total_slot = tier - published;
        let today_slot = (submiss < total_slot) ? submiss : total_slot;

        return {
            tier: tier,
            total_slot: total_slot,
            today_slot: today_slot
        }
    })
}

/* ================== Unpublish Functions ==================== */
const UnpublishFuncs = {
    kdp: (async(browser, page, account) => {
        let unpublish_flag = true;

        await botSleep(1);

        while (unpublish_flag) {
            // filter live product // #podbookshelftable_filter_input
            await waitForElement(page, '#podbookshelftable_filter_input');
            let filter_span = await page.$('#podbookshelftable_filter_input .a-declarative');
            await clickElement(filter_span, page);

            await botSleep(1);
            let live_span = await page.$('#podbookshelftable-publishing-status-filter-live a');
            await clickElement(live_span, page);

            await botSleep(1);
            await awaitLoadFinish(page, '.mt-loading-overlay').then((async) => {
                console.log('load live product done');
            });

            // unpublish first live item
            await botSleep(1);
            try {
                // find item ID
                let first_item = await getSelector(page, '#podbookshelftable tr', 0);
                let first_item_id = await page.evaluate(el => el.id, await first_item);

                console.log(first_item_id);

                // click kindle ebook action
                // zme-indie-bookshelf-dual-digital-actions-live-book-actions-R9AFE4C2CG8-main-action
                let promote_link = await page.$('#zme-indie-bookshelf-dual-digital-actions-live-book-actions-'+ first_item_id +'-main-action a')
                await clickElement(promote_link, page);

                // wait for select enrollment
                // kdp-promos-enrollment-details
                let select_enrollment = '#kdp-promos-enrollment-details-announce';
                await botSessionWaitfor(page, select_enrollment, account, 60000);
                await botSleep(1);
                await botClick(select_enrollment, page);

                // cancel select // exclusivityOptOutCheckBox
                // exclusivityOptOutPopupContent-save-announce
                await waitForElement(page, '#exclusivityOptOutPopupContent-save-announce');
                await botSleep(2);
                await botSleep(2);

                // uncheckbox
                console.log('uncheckbox');
                let uncheckbox = await page.$('#exclusivityOptOutCheckBox');
                await clickElement(uncheckbox, page);
                await botSleep(1);

                // click save button
                let saveBtn = await page.$('#exclusivityOptOutPopupContent-save-announce');
                await clickElement(saveBtn, page);
                await botSleep(2);

                // close popup // a-autoid-5-announce
                let closeBtn = await page.$('#a-autoid-5-announce');
                await clickElement(closeBtn, page);

                // back to bookshelf page then reload
                await botSleep(2);
                await page.goto('https://kdp.amazon.com/en_US/bookshelf');     

                // filter live product again
                await waitForElement(page, '#podbookshelftable_filter_input');
                await botSleep(1);
                let filter_span2 = await page.$('#podbookshelftable_filter_input .a-declarative');
                await clickElement(filter_span2, page);

                await botSleep(1);
                let live_span2 = await page.$('#podbookshelftable-publishing-status-filter-live a');
                await clickElement(live_span2, page);

                await botSleep(1);
                await awaitLoadFinish(page, '.mt-loading-overlay').then((async) => {
                    console.log('load live product again done');
                }); 

                // unpublish
                await botSleep(2);
                // actions button
                // #zme-indie-bookshelf-dual-digital-actions-live-book-actions-ENMR6HCX9A3-other-actions-announce
                // #zme-indie-bookshelf-dual-digital-actions-live-book-actions-JJGQ1V2WWRA-other-actions-announce
                let actionsBtn = await page.$('#zme-indie-bookshelf-dual-digital-actions-live-book-actions-' + first_item_id + '-other-actions-announce');
                let unpublishID = await page.evaluate(el => el.getAttribute("data-test-id"), actionsBtn);
                console.log('unpublishID', unpublishID);

                // hover actions button
                await page.hover('#zme-indie-bookshelf-dual-digital-actions-live-book-actions-' + first_item_id + '-other-actions-announce');

                await botSleep(1);
                let unpublishSel = await page.$('#' + unpublishID.replace("other-actions", "unpublish"));
                await clickElement(unpublishSel, page);

                await botSleep(1);
                await waitForElement(page, '#confirm-unpublish-announce');
                let confirmUnpublish = await page.$('#confirm-unpublish-announce');
                await botSleep(1);
                await clickElement(confirmUnpublish, page);
                //let cancelUnpublish = await page.$('#cancel-unpublish-announce');
                //await clickElement(cancelUnpublish, page);
                console.log('unpublished sucess');

                // back to bookshelf page then reload
                await botSleep(2);
                await botSleep(2);
                await page.goto('https://kdp.amazon.com/en_US/bookshelf');
            } catch (error) {
                console.log(error);
                unpublish_flag = false;
            }

            // get first item
            /* 
            await botSleep(1);
            try {
                // .podbookshelftable
                let first_item = await getSelector(page, '#podbookshelftable tr', 0);
                let first_item_id = await page.evaluate(el => el.id, await first_item);

                let price_link = await page.$('#zme-indie-bookshelf-dual-digital-price-list-price-' + first_item_id);
                await clickElement(price_link, page);

                //const imgs = await page.$$eval('#auth-captcha-image', imgs => imgs.map(img => img.getAttribute('src')));
                //const captchaImg = imgs[0];

                // wait for kdp select link
                let selectSel = '.jele-directive .a-link-null';
                await botSessionWaitfor(page, selectSel, account, 60000);
                await botSleep(1);
                await botClick(selectSel, page);

                // open new tab
                const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
                const newPage = await newPagePromise;

                // wait for kdp select page
                try {
                    // #ku-fr-royalty-option-large input
                    await waitForElement(newPage, '#ku-fr-royalty-option-large input', 15000);
                    let large_royalty = await newPage.$('#ku-fr-royalty-option-large input');
                    await clickElement(large_royalty);
                    await botSleep(1);
                } catch (error) {
                    // console.log(error);
                    console.log('no select price popup shown');
                }


                await waitForElement(newPage, '#kdp-promos-enrollment-details');
                await botSleep(1);
                let inputBtn = await newPage.$('#kdp-promos-enrollment-details input');
                await clickElement(inputBtn, newPage);

                await waitForElement(newPage, '#exclusivityOptOutPopupContent-save-announce');
                await botSleep(2);
                await botSleep(2);

                // uncheckbox
                console.log('uncheckbox');
                let uncheckbox = await newPage.$('#exclusivityOptOutCheckBox');
                await clickElement(uncheckbox, newPage);
                await botSleep(1);

                // click save button
                let saveBtn = await newPage.$('#exclusivityOptOutPopupContent-save-announce');
                await clickElement(saveBtn, newPage);

                // close new tab
                await botSleep(2);
                await newPage.close();

                // back to bookshelf page then reload
                await botSleep(1);
                await page.goto('https://kdp.amazon.com/en_US/bookshelf');
                // await page.goBack();
                await botSleep(1);
                // reload page
                // await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

                // filter live product again
                await waitForElement(page, '#podbookshelftable_filter_input');
                await botSleep(1);
                let filter_span2 = await page.$('#podbookshelftable_filter_input .a-declarative');
                await clickElement(filter_span2, page);

                await botSleep(1);
                let live_span2 = await page.$('#podbookshelftable-publishing-status-filter-live a');
                await clickElement(live_span2, page);

                await botSleep(1);
                await awaitLoadFinish(page, '.mt-loading-overlay').then((async) => {
                    console.log('load live product done');
                });

                await botSleep(2);
                await botSleep(1);

                // actions button
                // #zme-indie-bookshelf-dual-digital-actions-live-book-actions-ENMR6HCX9A3-other-actions-announce
                let actionsBtn = await page.$('#zme-indie-bookshelf-dual-digital-actions-live-book-actions-' + first_item_id + '-other-actions-announce');
                let unpublishID = await page.evaluate(el => el.getAttribute("data-test-id"), actionsBtn);
                console.log('unpublishID', unpublishID);

                // hover actions button
                await page.hover('#zme-indie-bookshelf-dual-digital-actions-live-book-actions-' + first_item_id + '-other-actions-announce');

                await botSleep(1);
                let unpublishSel = await page.$('#' + unpublishID.replace("other-actions", "unpublish"));
                await clickElement(unpublishSel, page);

                await waitForElement(page, '#confirm-unpublish-announce');
                let confirmUnpublish = await page.$('#confirm-unpublish-announce');
                await clickElement(confirmUnpublish, page);
                //let cancelUnpublish = await page.$('#cancel-unpublish-announce');
                //await clickElement(cancelUnpublish, page);

                await botSleep(2);

                // reload page
                await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
            } catch (error) {
                console.log(error);
                unpublish_flag = false;
            } */
        }
    })
}

async function awaitLoadFinish(page, loadingSel) {
    await page.waitForSelector(loadingSel , {
        visible: false, timeout: 20000
      }).then(() => {
        return Promise.resolve();
      }).catch(() => {
        return Promise.reject();
      })
} 

/* ================== Unpublish Functions ==================== */

/* ================== API Functions ==================== */

const ApiFuns = {
    getUploadInfos: (async(account_id) => {
        return $.ajax({
            url: config.host + "/account/get-detatail-account",
            type: "get",
            dataType: "text",
            data: {
                'id': account_id
            },
            success: function(result) {
                return result;
            },
            error: function(xhr, textStatus, errorThrown ) {
                return false;
            }
        })
    }),
    pushSales: (async(dataObj) => {
        let res = null;
        await $.ajax({
            url: config.host + "/account/save-check-sales",
            type: "post",
            dataType: "text",
            data: dataObj,
            success: function(result) {
                if (result) {
                    res = result;
                } else {
                    return false;
                }
            },
            error: function(xhr, textStatus, errorThrown ) {
                return false;
            }
        })

        if (res != null) {
            return JSON.parse(res);
        } else {return false;}
    }),
    push7Days: (async(dataObj) => {
        await $.ajax({
            url: config.host + "/account/save-six-day",
            type: "post",
            dataType: "text",
            data: dataObj,
            success: function(result) {
                console.log(result);
            },
            error: function(xhr, textStatus, errorThrown ) {
                
            }
        })
    }),
    uploadSuccess: (async(dataObj) => {
        await $.ajax({
            url: config.host + "/upload/success",
            type: "post",
            dataType: "text",
            data: dataObj,
            success: function(result) {
                return true;
            },
            error: function(xhr, textStatus, errorThrown ) {
                return false;
            }
        })
    }),
    uploadError: (async(dataObj) => {
        await $.ajax({
            url: config.host + "/upload/error",
            type: "post",
            dataType: "text",
            data: dataObj,
            success: function(result) {
                return true;
            },
            error: function(xhr, textStatus, errorThrown ) {
                return false;
            }
        })
    }),
    listDesigns: (async(dataObj) => {
        await $.ajax({
            url: config.host + "/edit-design/save-list-design",
            type: "post",
            dataType: "text",
            data: dataObj,
            success: function(result) {
                console.log(result);
            },
            error: function(xhr, textStatus, errorThrown ) {
                
            }
        })
    }),
    getChangedDesigns: (async(account_id) => {
        return await $.ajax({
            url: config.host + "/account/get-edit-design",
            type: "post",
            dataType: "text",
            data: {
                'id': account_id
            },
            success: function(result) {
                return result;
            },
            error: function(xhr, textStatus, errorThrown ) {
                return false;
            }
        })
    }),
    updateEditDesign: (async(dataObj) => {
        return await $.ajax({
            url: config.host + "/account/update-edit-design",
            type: "post",
            dataType: "text",
            data: dataObj,
            success: function(result) {
                return result;
            },
            error: function(xhr, textStatus, errorThrown ) {
                return false;
            }
        })
    })
}

function prepareTodayDateRange() {
    let todayDateRange = [];

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    let todayDate = new Date();
    todayDateRange.push({
        startYear: todayDate.getFullYear(), startMonth: monthNames[todayDate.getMonth()], startDate: todayDate.getDate(),
        endYear: todayDate.getFullYear(), endMonth: monthNames[todayDate.getMonth()], endDate: todayDate.getDate(), _preStr: "today"
    });

    let tempToday = new Date();
    let yesDate = new Date(tempToday.setDate(tempToday.getDate() - 1));
    todayDateRange.push({
        startYear: yesDate.getFullYear(), startMonth: monthNames[yesDate.getMonth()], startDate: yesDate.getDate(),
        endYear: yesDate.getFullYear(), endMonth: monthNames[yesDate.getMonth()], endDate: yesDate.getDate(), _preStr: "yesterday"
    });

    tempToday = new Date();
    let monday = tempToday.getDate() + (tempToday.getDay() == 0?-6:1) - tempToday.getDay();
    let firstDateOfWeek = new Date(tempToday.setDate(monday));
    todayDateRange.push({
        startYear: firstDateOfWeek.getFullYear(), startMonth: monthNames[firstDateOfWeek.getMonth()], startDate: firstDateOfWeek.getDate(),
        endYear: todayDate.getFullYear(), endMonth: monthNames[todayDate.getMonth()], endDate: todayDate.getDate(), _preStr: "cur_week"
    });

    tempToday = new Date();
    let firstDateOfLastWeek = new Date(tempToday.setDate(monday - 7));
    tempToday = new Date();
    let lastDateOfLastWeek = new Date(tempToday.setDate(monday - 1));
    todayDateRange.push({
        startYear: firstDateOfLastWeek.getFullYear(), startMonth: monthNames[firstDateOfLastWeek.getMonth()], startDate: firstDateOfLastWeek.getDate(),
        endYear: lastDateOfLastWeek.getFullYear(), endMonth: monthNames[lastDateOfLastWeek.getMonth()], endDate: lastDateOfLastWeek.getDate(), _preStr: "pre_week"
    });

    let firstDateOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    todayDateRange.push({
        startYear: firstDateOfMonth.getFullYear(), startMonth: monthNames[firstDateOfMonth.getMonth()], startDate: firstDateOfMonth.getDate(),
        endYear: todayDate.getFullYear(), endMonth: monthNames[todayDate.getMonth()], endDate: todayDate.getDate(), _preStr: "cur_month"
    });

    tempToday = new Date();
    let firstDateOfLastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
    let lastDateOfLastMonth = new Date(tempToday.setDate(0));
    todayDateRange.push({
        startYear: firstDateOfLastMonth.getFullYear(), startMonth: monthNames[firstDateOfLastMonth.getMonth()], startDate: firstDateOfLastMonth.getDate(),
        endYear: lastDateOfLastMonth.getFullYear(), endMonth: monthNames[lastDateOfLastMonth.getMonth()], endDate: lastDateOfLastMonth.getDate(), _preStr: "pre_month"
    });

    console.log(todayDateRange);
    return todayDateRange;
}

function prepare7DateRange(){
    let sevenDateRange = [];

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    let todayDate = new Date();
    for(let i = 0; i < 6; i++) {
        let addDate = new Date(todayDate.setDate(todayDate.getDate() - 1));
        let dateStr = getDateString(todayDate);
        sevenDateRange.push({
            startYear: addDate.getFullYear(), startMonth: monthNames[addDate.getMonth()], startDate: addDate.getDate(),
            endYear: addDate.getFullYear(), endMonth: monthNames[addDate.getMonth()], endDate: addDate.getDate(), _preStr: dateStr
        });
    }

    console.log(sevenDateRange);
    return sevenDateRange;
}

async function filterByDateRange(page, dateRange) {
    let preInputSel = await getSelector(page, '.input-group input', 0);
    let nextInputSel = await getSelector(page, '.input-group input', 1);
;
    await clickElement(preInputSel, page);
    await botSleep(0);

    let monthNameSel = '.ngb-dp-month-name';
    // wait for calendar
    await page.waitForSelector(monthNameSel, {timeout: 30000}).then(async() => {
    }).catch(() => {
        console.log("Wait for elements timeout.");
    });
    let monthName = await page.evaluate(el => el.text, await page.$(monthNameSel));
    let dateRangeMonthName = " " + dateRange.startMonth + " " + dateRange.startYear + " ";

    if (monthName != dateRangeMonthName) {
        let preMonthSel = await getSelector(page, '.ngb-dp-header .btn-link', 0);
        let nexMonthSel = await getSelector(page, '.ngb-dp-header .btn-link', 1);
        // try to go to next month first
        try { console.log('click next month'); await clickElement(nexMonthSel, page); } catch(error) { console.log(error); }

        // then compare again
        monthName = await page.evaluate(el => el.innerHTML, await page.$(monthNameSel));
        if (monthName != dateRangeMonthName)
        {
            // try to go to previos month first
            try { console.log('click pre month'); await clickElement(preMonthSel, page); } catch(error) { console.log(error); }
        }

        await botSleep(0);
    }

    // find the number to click
    let selectDate = await getSelector(page, '.ngb-dp-day .btn-light', dateRange.startDate - 1);
    await clickElement(selectDate, page);

    await botSleep(0);

    await clickElement(nextInputSel, page);
    await botSleep(0);

    // wait for calendar
    await page.waitForSelector(monthNameSel, {timeout: 30000}).then(async() => {
    }).catch(() => {
        console.log("Wait for elements timeout.");
    });

    monthName = await page.evaluate(el => el.text, await page.$(monthNameSel));
    dateRangeMonthName = " " + dateRange.endMonth + " " + dateRange.endYear + " ";

    if (monthName != dateRangeMonthName) {
        let preMonthSel = await getSelector(page, '.ngb-dp-header .btn-link', 0);
        let nexMonthSel = await getSelector(page, '.ngb-dp-header .btn-link', 1);
        // try to go to next month first
        try { console.log('click next month'); await clickElement(nexMonthSel, page); } catch(error) { console.log(error); }

        // then compare again
        monthName = await page.evaluate(el => el.innerHTML, await page.$(monthNameSel));
        if (monthName != dateRangeMonthName)
        {
            // try to go to previos month first
            try { console.log('click pre month'); await clickElement(preMonthSel, page); } catch(error) { console.log(error); }
        }

        await botSleep(0);
    }

    // find the number to click
    selectDate = await getSelector(page, '.ngb-dp-day .btn-light', dateRange.endDate - 1);
    await clickElement(selectDate, page);

    await botSleep(0);

    let goBtn = await page.$('ng-component .btn-secondary');
    await clickElement(goBtn, page);

    await botSleep(1);
}

async function getDataListing(page, details = false) {
    // wait for result
    await page.waitForSelector('#currency-summary-sold-USD', {timeout: 30000}).then(async() => {
    }).catch(() => {
        console.log("Wait for elements timeout.");
    });

    let us_sale = await page.evaluate(el => el.innerHTML, await page.$("#currency-summary-sold-USD"));
    let us_return = await page.evaluate(el => el.innerHTML, await page.$("#currency-summary-returned-USD"));
    let us_royalties = await getRoyalty(page, "#currency-summary-royalties-USD");

    let uk_sale = await page.evaluate(el => el.innerHTML, await page.$("#currency-summary-sold-GBP"));
    let uk_return = await page.evaluate(el => el.innerHTML, await page.$("#currency-summary-returned-GBP"));
    let uk_royalties = await getRoyalty(page, "#currency-summary-royalties-GBP");

    let de_sale = await page.evaluate(el => el.innerHTML, await page.$("#currency-summary-sold-EUR"));
    let de_return = await page.evaluate(el => el.innerHTML, await page.$("#currency-summary-returned-EUR"));
    let de_royalties = await getRoyalty(page, "#currency-summary-royalties-EUR");

    let us_listing = [];
    let uk_listing = [];
    let de_listing = [];

    if (details) {
        console.log('also get details');
        let numRow = 0;
        let emptyRow = false;
        while (!emptyRow) {

            if (await page.$("#record-"+ numRow +"-mkt") != null) {
                let pro_mkt = await page.evaluate(el => el.innerHTML, await page.$("#record-" + numRow + "-mkt"));
                let pro_title = await page.evaluate(el => el.innerHTML, await page.$("#record-" + numRow + "-title a"));
                let pro_link = await page.evaluate(el => el.href, await page.$("#record-" + numRow + "-title a"));
                let pro_type = await page.evaluate(el => el.innerHTML, await page.$("#record-" + numRow + "-product-type"));
                let pro_sale = await page.evaluate(el => el.innerHTML, await page.$("#record-" + numRow + "-sold"));
                let pro_return = await page.evaluate(el => el.innerHTML, await page.$("#record-" + numRow + "-returns"));
                let pro_revenue = await page.evaluate(el => el.innerHTML, await page.$("#record-" + numRow + "-revenue"));
                let pro_royalties = await getRoyalty(page, "#record-" + numRow + "-royalties");

                let sale_listing = {
                    pro_mkt: pro_mkt,
                    pro_title: pro_title,
                    pro_link: pro_link,
                    pro_type: pro_type,
                    pro_sale: pro_sale,
                    pro_return: pro_return,
                    pro_revenue: pro_revenue,
                    pro_royalties: pro_royalties,
                }

                if (pro_mkt == ".com") { us_listing.push(sale_listing); }
                if (pro_mkt == ".co.uk") { uk_listing.push(sale_listing); }
                if (pro_mkt == ".de") { de_listing.push(sale_listing); }
            } else {
                // break
                emptyRow = true;
            }

            numRow++;
        }
    }

    let dataListing = {
        us: {
            sale: us_sale,
            return: us_return,
            royalties: us_royalties,
            listing: us_listing
        },
        uk: {
            sale: uk_sale,
            return: uk_return,
            royalties: uk_royalties,
            listing: uk_listing
        },
        de: {
            sale: de_sale,
            return: de_return,
            royalties: de_royalties,
            listing: de_listing
        }
    };

    return dataListing;
}
/* ================== Checksale Functions ==================== */

/* ====================================== */
function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

async function botSleep(volume = 1) {
    let r = randomInt(1000, 2000)
    switch (volume) {
        case 0: r = randomInt(500, 1500); break;
        case 2: r = randomInt(5000, 7000); break;
        case 3: r = randomInt(10000, 20000); break;
        case 4: r = randomInt(30000, 50000); break;
    }

    if (volume > 10) { //set static miliseconds
        r = volume;
    }
    
    // console.log('delay ' + r + ' milliseconds')

    return new Promise((resolve) => {
        setTimeout(() => resolve(r), r)
    })
}

async function botClick(selector, page) {
    try {
      await page.waitForSelector(selector , {
        visible: true, timeout: 20000
      })
      await page.evaluate((selector) => document.querySelector(selector).click(), selector);
    } catch (err) {
      console.log('click failed ' + err)
      throw err
    }
}

async function clickElement(element, page) {
    await page.evaluate((element) => element.click(), element);
}

async function botPageNotLoad(page, selWaitfor) {
    if (await page.$(selWaitfor) == null) {
        // try to fresh f5
        console.log('reload page with wait selector: ', selWaitfor);
        
        await page.evaluate(() => {
           location.reload(true)
        })

        await page.waitForSelector(selWaitfor, {timeout: 60000}).then(async() => {
            await botSleep(1);
        })
    }
}

async function waitForElement(page, selWaitfor, _timeout = 30000) {
    await page.waitForSelector(selWaitfor, {timeout: _timeout}).then(async() => {
    });
    await botSleep(0);
}

async function waitforerrororsuccess(page, errorSel, successSel, _timeout = 600000) {
    let _result = false;
    let swwitch = 1;
    let breakflag = false;
    while (!breakflag) {
        let stepTimeout = 30000;

        _timeout = _timeout - stepTimeout;
        console.log('remain timeout ' + _timeout);

        if (_timeout < 0) {
            break;
        }

        if (swwitch == 1) { // wait for success element
            console.log('start wait for success element' + stepTimeout + ' miliseconds');
            await page.waitForSelector(successSel, {timeout: stepTimeout}).then(async() => {
                _result = true;
                breakflag = true;
            }).catch(() => {
                console.log('wait for success element failed');
            });

            swwitch = 2;
        } else { // wait for error element
            console.log('start wait for error element' + stepTimeout + ' miliseconds');
            await page.waitForSelector(errorSel, {
              visible: true, timeout: stepTimeout
            }).then(async() => {
                breakflag = true;
            }).catch(() => {
                console.log('wait for error element failed');
            });

            swwitch = 1;
        }
    }

    return _result;
}

async function botSessionWaitfor(page, selWaitfor, accTpl, _timeout = 30000) {
    console.log('botSessionWaitfor', _timeout);
    let firstTimeout = 180000; // if _timeout > 3 minutes
    if (_timeout > firstTimeout) { 
        let step = 1;
        let breakflag = false;
        while (!breakflag) {
            let stepTimeout = 60000;

            if (step == 1) {
                stepTimeout = firstTimeout;
                _timeout = _timeout - stepTimeout;
            } else {
                _timeout = _timeout - stepTimeout;
            }

            step++;
            console.log('remain timeout ' + _timeout);
            if (_timeout < 0) {
                break;
            }

            console.log('start wait for ' + stepTimeout + ' miliseconds');
            await page.waitForSelector(selWaitfor, {timeout: stepTimeout}).then(async() => {
                breakflag = true;
            }).catch(async() => {
                // check page logged in
                if (await isPageLoggedIn(page)) {
                    console.log('check login passed');
                } else {
                    let logginPageSel = "#a-page";
                    await tryLogin(page, logginPageSel, accTpl, selWaitfor);

                    breakflag = true;
                }
            });
        }
    } else {
        await page.waitForSelector(selWaitfor, {timeout: _timeout}).then(async() => {
        }).catch(async() => {
            // check page logged in
            if (await isPageLoggedIn(page)) {
            } else {
                let logginPageSel = "#a-page";
                await tryLogin(page, logginPageSel, accTpl, selWaitfor);
            }
        });
    }
}

async function tryLogin(page, loginSel, account, goalSel) {
    let loggedIn = false;
    let loginTimeout = 3; 

    try {
        await botPageNotLoad(page, loginSel); 

        await fillLogin(page, account.email, account.pass);

        while (loginTimeout >= 1 && !loggedIn) {
            console.log('wait for login success');
            await page.waitForSelector(goalSel, {timeout: 60000}).then(async() => {
                if (await isPageLoggedIn(page)) {
                    loggedIn = true;
                }
            }).catch(async(error) => {
                if (loginTimeout > 1) {
                    // console.log(error);
                    try {
                        await botPageNotLoad(page, loginSel);
                        console.log('login again');
                        botSleep(1);
                        await fillLogin(page, account.email, account.pass); 
                    } catch {
                        console.log('loginTimeout = 0');
                        loginTimeout = 0;
                    }
                }
            })

            loginTimeout--;
        }
    } catch (error) {
        console.log(error);
    }

    return loggedIn;
}

async function getSelector(page, sel, position) {
    const elements = await page.$$(sel);
    return elements[position];
}

async function findSelector(page, sel, query) {
    const elements = await page.$$(sel);

    for(let element of elements) {
        let text = await page.evaluate(el => el.innerHTML, element);
        if (text == query) {
            return element;
        }
    }

    return false;
}

async function typeEmptyInput(page, sel, text, max_char = 0) {
    if (max_char != 0) {
        text = text.substring(0, max_char);
    }

    if (await page.$(sel) != null) {
        /*let selElement = await page.$(sel);
        await clickElement(selElement, page);
        await botSleep(0);

        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');*/
        await page.type(sel, ''); await botSleep(0);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(sel, text);

        await botSleep(1);
    }
}

async function pasteInput(text, selector, page) {
    // await page.click(selector); await botSleep(0);
    /*let selElement = await page.$(selector);
    await clickElement(selElement, page);
    await botSleep(0);*/
    await page.type(selector, ''); await botSleep(0);
    await page.evaluate((text, selector) => document.querySelector(selector).value = text, text, selector);
}

async function getRoyalty(page, selector) {
    let us_rolay = 0;
    let us_royal_text = await page.evaluate(el => el.innerHTML, await page.$(selector));
    if (us_royal_text.indexOf("-") != -1) { // if minus
        return "-" + us_royal_text.substring(2);
    } else {
        return us_royal_text.substring(1);
    }
}

function getDateString(_date) {
    let dateStr = _date.getFullYear()  + "-" + ("0"+(_date.getMonth()+1)).slice(-2) + "-" + ("0" + _date.getDate()).slice(-2);
    return dateStr;
}

async function test(page) {
    let preInputSel = await getSelector(page, '.input-group input', 0);
    let nextInputSel = await getSelector(page, '.input-group input', 1);

    console.log('click pre input');
    await clickElement(preInputSel, page);

    //await SaleFuncs.normalCheck(page, id);
    //await botSleep(1);
    //await SaleFuncs.sevenCheck(page);
}

/* ======================================= */
async function getCaptchaText(captchaImg){
    let _return = {
        status: false,
        captcha: null
    }

    let apikey = '3ccbc20e3e94cb3913529e4738938a95';

    var solver = require('2captcha');

    solver.setApiKey(apikey);

    solver.decodeUrl(captchaImg, {pollingInterval: 10000}, function(err, result, invalid) {
        _return.captcha = result.text;
        _return.status = true;
    });

    let captcha_timeout = 5;
    while (!_return.status && captcha_timeout > 0) {
        await botSleep(2);
        captcha_timeout--;
    }

    return _return;
}

module.exports = {
    isPageLoggedIn,
    fillLogin,
    botUploadEbook,
    botUploadPPB,
    SaleFuncs,
    UnpublishFuncs,
    ApiFuns,
    botSleep,
    botClick,
    botPageNotLoad,
    getSelector,
    test
}