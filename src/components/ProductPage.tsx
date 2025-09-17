import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Download } from 'lucide-react';
import * as sellerApi from '../api/sellerApi';
import { Product, Variant } from '../constants/types';

const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState<string>('');

  const downloadUrl = 'https://juno.com.pk/download';
  const qrCodeApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&bgcolor=0A0A0A&color=ffffff&data=';

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product not found.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await sellerApi.Products.GetProductByID(productId);
        if (response.ok && response.body) {
          const fetchedProduct = response.body as Product;
          setProduct(fetchedProduct);
          setMainImage(fetchedProduct.images[0]);
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            const defaultVariant = fetchedProduct.variants.find(v => v.is_default) || fetchedProduct.variants[0];
            setSelectedVariant(defaultVariant);
            setSelectedOptions(defaultVariant.options);
          }
        } else {
          setError('Failed to fetch product details.');
        }
      } catch (err) {
        setError('An error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product && product.options) {
        const findVariant = () => {
            return product.variants.find(variant => 
                Object.entries(selectedOptions).every(([key, value]) => variant.options[key] === value)
            );
        };
        const variant = findVariant();
        setSelectedVariant(variant || null);
    }
  }, [selectedOptions, product]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white text-center p-4">
        <div>
          <h2 className="text-3xl font-bold text-error mb-4">Error</h2>
          <p>{error || 'Product could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-dark min-h-screen pt-24 pb-16">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative mb-4">
              <img src={mainImage} alt={product.title} className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <img 
                  key={index} 
                  src={img} 
                  alt={`Thumbnail ${index + 1}`} 
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 rounded-md object-cover cursor-pointer border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                />
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <Link to={`/${product.seller_name.toLowerCase().replace(/ /g, '-')}`} className="text-primary font-semibold hover:underline">{product.seller_name}</Link>
            <h1 className="text-4xl font-bold text-white my-2">{product.title}</h1>
            <div className="flex items-baseline space-x-3 mb-6">
              <p className="text-3xl font-bold gradient-text">Rs. {selectedVariant?.price.toLocaleString() || product.pricing.price.toLocaleString()}</p>
              {product.pricing.compare_at_price && <p className="text-xl text-neutral-500 line-through">Rs. {product.pricing.compare_at_price.toLocaleString()}</p>}
            </div>

            <div className="prose prose-invert text-neutral-300 mb-8" dangerouslySetInnerHTML={{ __html: product.description }} />

            <div className="space-y-6 mb-8">
              {product.options.map(option => (
                <div key={option.name}>
                  <h3 className="text-lg font-semibold text-white mb-2">{option.name}</h3>
                  <div className="flex flex-wrap gap-3">
                    {option.values.map(value => (
                      <button 
                        key={value}
                        onClick={() => handleOptionSelect(option.name, value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                          selectedOptions[option.name] === value 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                        }`}>
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-800">
              <h3 className="text-xl font-bold text-white mb-4">Available Exclusively on the Juno App</h3>
              <p className="text-neutral-400 mb-6">Scan the QR code or click the button below to download the app and purchase this item.</p>
              <div className="bg-neutral-900 p-6 rounded-lg flex flex-col sm:flex-row items-center gap-6">
                <div className="p-2 bg-white rounded-lg inline-block">
                  <img src={`${qrCodeApiBase}${encodeURIComponent(downloadUrl)}`} alt="Download Juno App QR Code" width="150" height="150" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-lg font-semibold text-white">Get the full experience</h4>
                  <p className="text-neutral-400 mb-4">Swipe, shop, and discover on the go.</p>
                  <a href="/download" className="btn btn-primary w-full sm:w-auto group">
                    <Download className="mr-2" size={20}/> Download Now
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;