import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

function BrandPartners() {
    const { t } = useLanguage();
    const brands = [
        {
            id: 1,
            name: "Nike",
            logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
            alt: "Nike"
        },
        {
            id: 2,
            name: "Adidas",
            logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
            alt: "Adidas"
        },
        {
            id: 3,
            name: "Puma",
            logo: "https://upload.wikimedia.org/wikipedia/en/d/da/Puma_complete_logo.svg",
            alt: "Puma"
        },
        {
            id: 4,
            name: "Gucci",
            logo: "https://logos-world.net/wp-content/uploads/2020/04/Gucci-Logo.png",
            alt: "Gucci"
        },
        {
            id: 5,
            name: "Zara",
            logo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
            alt: "Zara"
        },
        {
            id: 6,
            name: "H&M",
            logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
            alt: "H&M"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <div className="brand-partners-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <h2 className="section-title gradient-text">{t('brand_partners_title')}</h2>
                    <p className="section-subtitle">{t('brand_partners_subtitle')}</p>
                </motion.div>

                <motion.div
                    className="brand-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {brands.map((brand) => (
                        <motion.div
                            key={brand.id}
                            className="brand-item"
                            variants={itemVariants}
                            whileHover={{
                                scale: 1.1,
                                y: -5,
                                filter: "grayscale(0%)"
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <img
                                src={brand.logo}
                                alt={brand.alt}
                                className="brand-logo"
                                loading="lazy"
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

export default BrandPartners;
