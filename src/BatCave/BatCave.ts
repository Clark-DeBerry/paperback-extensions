import {
  Source,
  Manga,
  Chapter,
  Page,
  Request,
  Response,
  SourceInfo,
  ContentRating,
  MangaStatus
} from '@paperback/types'

export const BatCaveInfo: SourceInfo = {
  version: '1.0.0',
  name: 'BatCave',
  icon: 'icon.png',
  author: 'Custom',
  description: 'Extension for BatCave (batcave.biz)',
  contentRating: ContentRating.MATURE,
  websiteBaseURL: 'https://batcave.biz'
}

export class BatCave extends Source {
  async getMangaDetails(mangaId: string): Promise<Manga> {
    const request = createRequestObject({
      url: `${BatCaveInfo.websiteBaseURL}/${mangaId}`,
      method: 'GET'
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)

    const title = $('.comic-title, h1').first().text().trim() || mangaId
    const image = $('.comic-cover img, .cover img').first().attr('src') || ''
    const desc = $('.description, .summary, .comic-info').first().text().trim() || ''

    return createManga({
      id: mangaId,
      titles: [title],
      image: image.startsWith('http') ? image : `${BatCaveInfo.websiteBaseURL}${image}`,
      status: MangaStatus.ONGOING,
      desc: desc
    })
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const request = createRequestObject({
      url: `${BatCaveInfo.websiteBaseURL}/${mangaId}`,
      method: 'GET'
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)
    const chapters: Chapter[] = []

    $('.chapter-list a, .chapters a, a[href*="chapter"]').each((index, element) => {
      const href = $(element).attr('href') || ''
      const name = $(element).text().trim()
      const id = href.replace(BatCaveInfo.websiteBaseURL, '').replace(/^\//, '')

      if (id) {
        chapters.push(
          createChapter({
            id: id,
            mangaId: mangaId,
            name: name || `Chapter ${index + 1}`,
            chapNum: index + 1,
            time: new Date()
          })
        )
      }
    })

    return chapters
  }

  async getPageList(chapterId: string, mangaId: string): Promise<Page[]> {
    const request = createRequestObject({
      url: `${BatCaveInfo.websiteBaseURL}/${chapterId}`,
      method: 'GET'
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)
    const pages: Page[] = []

    $('.page-image img, #reader img, .chapter-content img').each((index, element) => {
      const imageUrl = $(element).attr('src') || $(element).attr('data-src') || ''
      if (imageUrl) {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${BatCaveInfo.websiteBaseURL}${imageUrl}`
        pages.push(
          createPage({
            id: `${index}`,
            image: fullUrl
          })
        )
      }
    })

    return pages
  }
}
