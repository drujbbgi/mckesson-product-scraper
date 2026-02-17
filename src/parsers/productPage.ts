import * as cheerio from 'cheerio';
import { ProductDetails, ProductSpecification } from '../types';
import { logger } from '../utils/logger';

/**
 * Parse the product details page HTML and extract all product information
 */
export function parseProductPage(html: string, productUrl: string): ProductDetails {
  const $ = cheerio.load(html);

  // Extract McKesson ID from product header
  const mckessonId = $('.product-header-id').first().attr('id') ||
                     $('.product-header-id').first().text().replace('#', '').trim();

  // Extract product title
  const title = $('.prod-title').first().text().trim();

  // Extract invoice title
  const invoiceTitle = $('.prod-invoice-title').first().text().trim() || undefined;

  // Extract manufacturer number from the header
  const headerItems = $('.product-header li');
  let manufacturerNumber = '';
  let manufacturer = '';

  headerItems.each((_, li) => {
    const text = $(li).text().trim();
    if (!$(li).hasClass('product-header-id') && text.includes('#')) {
      const match = text.match(/(.+?)\s*#(.+)/);
      if (match) {
        manufacturer = match[1].replace(/&nbsp;/g, ' ').trim();
        manufacturerNumber = match[2].trim();
      }
    }
  });

  // Extract all product images from the image gallery carousel
  const images: string[] = [];
  const originalImages: string[] = [];

  // Find images in the main image gallery (not thumbnails or related products)
  // The gallery structure: .image-gallery.gallery .image-zoom contains both
  // - <a href="...Original_Image..."> for full size
  // - <img src="...High_Res..."> for high res display
  $('.image-gallery.gallery .image-zoom').each((_, elem) => {
    const $elem = $(elem);

    // Get high-res image from img src
    const highResImg = $elem.find('img').first();
    const highResSrc = highResImg.attr('src');
    if (highResSrc && highResSrc.includes('imgcdn.mckesson.com') && !images.includes(highResSrc)) {
      images.push(highResSrc);
    }

    // Get original/full-size image from anchor href
    const originalLink = $elem.find('a').first();
    const originalHref = originalLink.attr('href');
    if (originalHref && originalHref.includes('imgcdn.mckesson.com') && !originalImages.includes(originalHref)) {
      originalImages.push(originalHref);
    }
  });

  // Use placeholder image if no product images found
  const PLACEHOLDER_IMAGE = 'https://cdn.prod.website-files.com/68af9060d585e89323ce4b59/6993fffa8ae6f351bcbe96fe_ndr_placeholder_white.png';
  if (images.length === 0) {
    images.push(PLACEHOLDER_IMAGE);
  }

  // Main image URL is the first high-res image (for backward compatibility)
  const imageUrl = images[0];

  // Extract specifications from the specifications section
  const specifications: ProductSpecification[] = [];
  const specificationsSection = $('#specifications');

  specificationsSection.find('table tr').each((_, row) => {
    const $row = $(row);
    const key = $row.find('th').text().trim();
    const value = $row.find('td').text().trim();

    if (key && value) {
      specifications.push({ key, value });
    }
  });

  // Also extract from specifications table outside the #specifications div
  // (backup in case structure differs)
  if (specifications.length === 0) {
    $('table.table tr').each((_, row) => {
      const $row = $(row);
      const key = $row.find('th').text().trim();
      const value = $row.find('td').text().trim();

      if (key && value) {
        specifications.push({ key, value });
      }
    });
  }

  // Extract features from the FULL features section (inside #specifications)
  // NOT the shortened version with "More ..." link
  const features: string[] = [];

  // Find the features section within the specifications area
  // This is the full feature list, not the truncated one
  const fullFeaturesSection = specificationsSection.find('#features').parent();

  if (fullFeaturesSection.length > 0) {
    fullFeaturesSection.find('.product-features li').each((_, li) => {
      const $li = $(li);
      // Skip the "More ..." link
      if (!$li.hasClass('more')) {
        const featureText = $li.text().trim();
        if (featureText && featureText !== 'More …' && !featureText.startsWith('More')) {
          features.push(featureText);
        }
      }
    });
  }

  // If no features found in the primary location, try another approach
  // Look for product-features that don't have a "more" link as sibling
  if (features.length === 0) {
    $('#specifications .product-features li').each((_, li) => {
      const $li = $(li);
      if (!$li.hasClass('more')) {
        const featureText = $li.text().trim();
        if (featureText && featureText !== 'More …' && !featureText.startsWith('More')) {
          features.push(featureText);
        }
      }
    });
  }

  // Extract brand from specifications if not already found
  let brand = specifications.find((s) => s.key === 'Brand')?.value;

  // Extract manufacturer from specifications if not already found
  if (!manufacturer) {
    manufacturer = specifications.find((s) => s.key === 'Manufacturer')?.value || '';
  }

  // Extract manufacturer number from specifications if not already found
  if (!manufacturerNumber) {
    manufacturerNumber = specifications.find((s) => s.key === 'Manufacturer #')?.value || '';
  }

  logger.debug(`Parsed product ${mckessonId}: ${title}, ${specifications.length} specs, ${features.length} features, ${images.length} images`);

  return {
    mckessonId,
    manufacturerNumber,
    title,
    invoiceTitle,
    brand,
    manufacturer,
    imageUrl,
    images,
    originalImages,
    specifications,
    features,
    productUrl,
  };
}

/**
 * Validate that product details contain required fields
 */
export function isValidProduct(product: ProductDetails): boolean {
  return !!(product.mckessonId && product.title);
}