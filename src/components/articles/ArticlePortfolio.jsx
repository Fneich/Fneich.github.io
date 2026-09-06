import "./ArticlePortfolio.scss"
import React, {useEffect, useState} from 'react'
import Article from "/src/components/articles/base/Article.jsx"
import Transitionable from "/src/components/capabilities/Transitionable.jsx"
import {useViewport} from "/src/providers/ViewportProvider.jsx"
import {useConstants} from "/src/hooks/constants.js"
import AvatarView from "/src/components/generic/AvatarView.jsx"
import {Tag, Tags} from "/src/components/generic/Tags.jsx"
import ArticleItemPreviewMenu from "/src/components/articles/partials/ArticleItemPreviewMenu.jsx"
import {useLanguage} from "/src/providers/LanguageProvider.jsx"

/**
 * Font Awesome icons used as a fallback avatar for items that haven't been assigned
 * a custom image/icon yet. Falls back further to a generic icon for unmapped categories.
 */
const CATEGORY_FALLBACK_ICONS = {
    category_land_management: "fa-solid fa-map-location-dot",
    category_application: "fa-solid fa-display",
    category_geoai: "fa-solid fa-brain",
    category_health: "fa-solid fa-heart-pulse",
}
const CATEGORY_FALLBACK_ICON_DEFAULT = "fa-solid fa-diagram-project"

/**
 * Background colors used as a fallback avatar for items that haven't been assigned
 * a custom color yet. The same categoryId always resolves to the same color.
 */
const CATEGORY_FALLBACK_COLOR_PALETTE = ["#00A9E0", "#8E44AD", "#16A085", "#E67E22", "#4CAF50", "#E74C3C", "#512BD4", "#F7941D"]

function _hashStringToIndex(text, modulo) {
    let hash = 0
    for (let i = 0; i < text.length; i++)
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0
    return hash % modulo
}

function getFallbackFaIcon(categoryId) {
    return CATEGORY_FALLBACK_ICONS[categoryId] || CATEGORY_FALLBACK_ICON_DEFAULT
}

function getFallbackFaIconStyle(categoryId) {
    const index = _hashStringToIndex(categoryId || "default", CATEGORY_FALLBACK_COLOR_PALETTE.length)
    return {
        backgroundColor: CATEGORY_FALLBACK_COLOR_PALETTE[index],
        color: "#EEEEEE"
    }
}

/**
 * @param {ArticleDataWrapper} dataWrapper
 * @param {Number} id
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolio({ dataWrapper, id }) {
    const [selectedItemCategoryId, setSelectedItemCategoryId] = useState(null)
    const [selectedTags, setSelectedTags] = useState([])

    return (
        <Article id={dataWrapper.uniqueId}
                 type={Article.Types.SPACING_DEFAULT}
                 dataWrapper={dataWrapper}
                 className={`article-portfolio`}
                 selectedItemCategoryId={selectedItemCategoryId}
                 setSelectedItemCategoryId={setSelectedItemCategoryId}>
            <ArticlePortfolioTagFilter dataWrapper={dataWrapper}
                                       selectedTags={selectedTags}
                                       setSelectedTags={setSelectedTags}/>

            <ArticlePortfolioItems dataWrapper={dataWrapper}
                                   selectedItemCategoryId={selectedItemCategoryId}
                                   selectedTags={selectedTags}/>
        </Article>
    )
}

/**
 * A multi-select tag filter, combined with the category filter (rendered by <Article/>) using AND logic.
 * Tags are derived dynamically from the article's items - nothing is hardcoded.
 * @param {ArticleDataWrapper} dataWrapper
 * @param {String[]} selectedTags
 * @param {Function} setSelectedTags
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioTagFilter({ dataWrapper, selectedTags, setSelectedTags }) {
    const allTags = Array.from(new Set(
        dataWrapper.getOrderedItemsFilteredBy(null).flatMap(item => item.locales.tags || [])
    )).sort((a, b) => a.localeCompare(b))

    if(allTags.length === 0)
        return <></>

    const _toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ?
                prev.filter(t => t !== tag) :
                [...prev, tag]
        )
    }

    return (
        <Tags className={`article-portfolio-tag-filter mb-3`}>
            {allTags.map((tag, key) => (
                <Tag key={key}
                     text={tag}
                     variant={selectedTags.includes(tag) ? Tag.Variants.DEFAULT : Tag.Variants.DARK}
                     onClick={() => _toggleTag(tag)}/>
            ))}
        </Tags>
    )
}

/**
 * @param {ArticleDataWrapper} dataWrapper
 * @param {String} selectedItemCategoryId
 * @param {String[]} selectedTags
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItems({ dataWrapper, selectedItemCategoryId, selectedTags }) {
    const constants = useConstants()
    const language = useLanguage()
    const viewport = useViewport()

    const categoryFilteredItems = dataWrapper.getOrderedItemsFilteredBy(selectedItemCategoryId)
    const filteredItems = selectedTags.length === 0 ?
        categoryFilteredItems :
        categoryFilteredItems.filter(item => selectedTags.every(tag => (item.locales.tags || []).includes(tag)))

    const customBreakpoint = viewport.getCustomBreakpoint(constants.SWIPER_BREAKPOINTS_FOR_THREE_SLIDES)

    const itemsPerRow = customBreakpoint?.slidesPerView || 1
    const itemsPerRowClass = `article-portfolio-items-${itemsPerRow}-per-row`

    const refreshFlag = (dataWrapper.categories?.length ?
        selectedItemCategoryId + "-" + language.getSelectedLanguage()?.id :
        language.getSelectedLanguage()?.id) + "-" + selectedTags.join(",")

    if(dataWrapper.categories?.length) {
        return (
            <Transitionable id={dataWrapper.uniqueId}
                            refreshFlag={refreshFlag}
                            delayBetweenItems={100}
                            animation={Transitionable.Animations.POP}
                            className={`article-portfolio-items ${itemsPerRowClass}`}>
                {filteredItems.map((itemWrapper, key) => (
                    <ArticlePortfolioItem itemWrapper={itemWrapper}
                                          key={key}/>
                ))}
            </Transitionable>
        )
    }
    else {
        return (
            <div className={`article-portfolio-items ${itemsPerRowClass} mb-3 mb-lg-2`}>
                {filteredItems.map((itemWrapper, key) => (
                    <ArticlePortfolioItem itemWrapper={itemWrapper}
                                          key={key}/>
                ))}
            </div>
        )
    }
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItem({ itemWrapper }) {
    const hasCustomAvatar = Boolean(itemWrapper.img || itemWrapper.faIcon)

    const avatarFaIcon = itemWrapper.img ?
        undefined :
        (itemWrapper.faIcon || getFallbackFaIcon(itemWrapper.categoryId))

    const avatarStyle = (!itemWrapper.img && !hasCustomAvatar) ?
        getFallbackFaIconStyle(itemWrapper.categoryId) :
        itemWrapper.faIconStyle

    return (
        <div className={`article-portfolio-item`}>
            <AvatarView src={itemWrapper.img}
                        faIcon={avatarFaIcon}
                        style={avatarStyle}
                        alt={itemWrapper.imageAlt}
                        className={`article-portfolio-item-avatar`}/>

            <ArticlePortfolioItemTitle itemWrapper={itemWrapper}/>
            <ArticlePortfolioItemBody itemWrapper={itemWrapper}/>
            <ArticlePortfolioItemFooter itemWrapper={itemWrapper}/>
        </div>
    )
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItemTitle({ itemWrapper }) {
    return (
        <div className={`article-portfolio-item-title`}>
            <h5 className={`article-portfolio-item-title-main`}
                dangerouslySetInnerHTML={{__html: itemWrapper.locales.title || itemWrapper.placeholder}}/>

            <div className={`article-portfolio-item-title-category text-2`}
                 dangerouslySetInnerHTML={{__html: itemWrapper.category?.label }}/>
        </div>
    )
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItemBody({ itemWrapper }) {
    const language = useLanguage()
    const [expanded, setExpanded] = useState(false)

    const shortText = itemWrapper.locales.text
    const fullText = itemWrapper.locales.textFull || shortText

    const hasExtendedText = Boolean(itemWrapper.locales.textFull && itemWrapper.locales.textFull !== shortText)
    const hasContribution = itemWrapper.type === "collaboration" && Boolean(itemWrapper.locales.myContribution)
    const canExpand = hasExtendedText || hasContribution

    return (
        <div className={`article-portfolio-item-body`}>
            <Tags className={`article-portfolio-item-body-tags`}>
                {itemWrapper.locales.tags && Boolean(itemWrapper.locales.tags.length) && itemWrapper.locales.tags.map((tag, key) => (
                    <Tag key={key}
                         text={tag}
                         variant={Tag.Variants.DARK}
                         className={`article-portfolio-item-body-tag text-1`}/>
                ))}
            </Tags>

            <div className={`article-portfolio-item-body-description text-2`}
                 dangerouslySetInnerHTML={{__html: expanded ? fullText : shortText}}/>

            {expanded && hasContribution && (
                <div className={`article-portfolio-item-body-contribution text-2`}>
                    <strong>{language.getString("my_contribution")}: </strong>
                    <span dangerouslySetInnerHTML={{__html: itemWrapper.locales.myContribution}}/>
                </div>
            )}

            {canExpand && (
                <button type={`button`}
                        className={`article-portfolio-item-body-toggle text-1`}
                        onClick={() => setExpanded(!expanded)}>
                    {expanded ? language.getString("see_less") : language.getString("see_more")}
                </button>
            )}
        </div>
    )
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItemFooter({ itemWrapper }) {
    const hasPreview = itemWrapper.preview
    const hasPreviewLinks = itemWrapper.preview?.hasLinks
    const hasScreenshotsOrVideo = itemWrapper.preview?.hasScreenshotsOrYoutubeVideo

    const previewMenuAvailable = hasPreview && (hasPreviewLinks || hasScreenshotsOrVideo)
    if(!previewMenuAvailable)
        return <></>

    return (
        <div className={`article-portfolio-item-footer`}>
            <ArticleItemPreviewMenu itemWrapper={itemWrapper}
                                    spaceBetween={true}
                                    className={`article-portfolio-item-footer-menu`}/>
        </div>
    )
}

export default ArticlePortfolio
