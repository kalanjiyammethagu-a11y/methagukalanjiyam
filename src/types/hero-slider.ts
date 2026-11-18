export interface HeroSlideData {
  id: string;
  bannerImage: string;
  mobileBannerImage?: string;
  bookImage?: string;
  slug: string;
  year?: string;
  categoryTa: string;
  categoryEn: string;
  eyebrowTa: string;
  eyebrowEn: string;
  titleTa: string;
  titleEn: string;
  subtitleTa: string;
  subtitleEn: string;
  ctaPrimaryLabelTa: string;
  ctaPrimaryLabelEn: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabelTa?: string;
  ctaSecondaryLabelEn?: string;
  ctaSecondaryHref?: string;
  quoteTa?: string;
  quoteEn?: string;
}

export interface HeroSliderProps {
  slides?: HeroSlideData[];
  autoplayDelay?: number;
  className?: string;
  priorityIndex?: number;
}

