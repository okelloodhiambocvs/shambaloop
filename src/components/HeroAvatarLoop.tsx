import React, { useState, useEffect } from 'react';
import babyCalfImg from '../assets/images/dairy_calf_baby_1789547904840.jpg';
import fertileShambaImg from '../assets/images/kenyan_fertile_shamba_1789547934588.jpg';
import pedigreeCowImg from '../assets/images/pedigree_cow_livestock_1789547947480.jpg';
import africanFarmerImg from '../assets/images/african_farmer_portrait_1789549028340.jpg';
import africanLivestockImg from '../assets/images/african_livestock_goat_1789549039925.jpg';
import womanFarmerImg from '../assets/images/kenyan_woman_farmer_1789547975438.jpg';
import babyLambImg from '../assets/images/baby_lamb_pasture_1789547988863.jpg';

export type LoopCategory = 'all' | 'livestock' | 'lands' | 'farmers';

export interface LoopItem {
  id: string;
  name: string;
  category: 'livestock' | 'lands' | 'farmers';
  image: string;
  desktopPosition: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  sizeClass: string;
  animationClass: string;
}

export interface FlankItem extends LoopItem {
  flank: 'left' | 'right';
}

export const LEFT_HERO_ITEMS: FlankItem[] = [
  // --- Upper Left Cluster (3 items) ---
  {
    id: 'left-farmer-grace',
    name: 'Grace Wanjiku',
    category: 'farmers',
    image: womanFarmerImg,
    desktopPosition: { top: '2%', left: '4%' },
    sizeClass: 'w-14 h-14 xl:w-16 xl:h-16',
    animationClass: 'animate-hero-float-1',
    flank: 'left',
  },
  {
    id: 'left-cow-pedigree',
    name: 'Livestock Shamba',
    category: 'livestock',
    image: pedigreeCowImg,
    desktopPosition: { top: '14%', right: '6%' },
    sizeClass: 'w-16 h-16 xl:w-20 xl:h-20',
    animationClass: 'animate-hero-float-2',
    flank: 'left',
  },
  {
    id: 'left-african-livestock-1',
    name: 'African Livestock',
    category: 'livestock',
    image: africanLivestockImg,
    desktopPosition: { top: '30%', left: '16%' },
    sizeClass: 'w-12 h-12 xl:w-14 xl:h-14',
    animationClass: 'animate-hero-float-3',
    flank: 'left',
  },

  // --- Lower Left Cluster (1 retained item) ---
  {
    id: 'left-baby-lamb',
    name: 'Pasture Lamb',
    category: 'livestock',
    image: babyLambImg,
    desktopPosition: { bottom: '30%', left: '8%' },
    sizeClass: 'w-12 h-12 xl:w-14 xl:h-14',
    animationClass: 'animate-hero-float-4',
    flank: 'left',
  },
];

export const RIGHT_HERO_ITEMS: FlankItem[] = [
  // --- Upper Right Cluster (3 items) ---
  {
    id: 'right-land-shamba',
    name: 'Highland Shamba',
    category: 'lands',
    image: fertileShambaImg,
    desktopPosition: { top: '2%', right: '4%' },
    sizeClass: 'w-14 h-14 xl:w-16 xl:h-16',
    animationClass: 'animate-hero-float-3',
    flank: 'right',
  },
  {
    id: 'right-farmer-african',
    name: 'African Farmer',
    category: 'farmers',
    image: africanFarmerImg,
    desktopPosition: { top: '14%', left: '6%' },
    sizeClass: 'w-16 h-16 xl:w-19 xl:h-19',
    animationClass: 'animate-hero-float-4',
    flank: 'right',
  },
  {
    id: 'right-calf-livestock',
    name: 'Dairy Calf',
    category: 'livestock',
    image: babyCalfImg,
    desktopPosition: { top: '30%', right: '16%' },
    sizeClass: 'w-12 h-12 xl:w-14 xl:h-14',
    animationClass: 'animate-hero-float-1',
    flank: 'right',
  },

  // --- Lower Right Cluster (1 retained item) ---
  {
    id: 'right-land-rift',
    name: 'Rift Valley Shamba',
    category: 'lands',
    image: fertileShambaImg,
    desktopPosition: { bottom: '30%', right: '8%' },
    sizeClass: 'w-12 h-12 xl:w-14 xl:h-14',
    animationClass: 'animate-hero-float-2',
    flank: 'right',
  },
];

export const HERO_LOOP_ITEMS: FlankItem[] = [...LEFT_HERO_ITEMS, ...RIGHT_HERO_ITEMS];

interface HeroAvatarLoopProps {
  onSelectCategory?: (category: LoopCategory) => void;
  onItemClick?: (item: LoopItem) => void;
  activeFilter?: LoopCategory;
  isDarkMode?: boolean;
}

export default function HeroAvatarLoop({
  activeFilter = 'all',
}: HeroAvatarLoopProps) {
  const [activeLoopIndex, setActiveLoopIndex] = useState<number>(0);

  // Smooth continuous looping through the items to highlight active community assets
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLoopIndex((prev) => (prev + 1) % HERO_LOOP_ITEMS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const activeLoopItem = HERO_LOOP_ITEMS[activeLoopIndex];

  const renderFlankItem = (item: FlankItem, index: number) => {
    const isCurrentActiveLoop = activeLoopItem?.id === item.id;
    const isCategoryMatch = activeFilter === 'all' || activeFilter === item.category;
    const opacityClass = isCategoryMatch ? 'opacity-100' : 'opacity-30';

    return (
      <div
        key={item.id}
        className={`pointer-events-none absolute select-none transition-all duration-500 ${item.animationClass}`}
        style={{
          top: item.desktopPosition.top,
          bottom: item.desktopPosition.bottom,
          left: item.desktopPosition.left,
          right: item.desktopPosition.right,
        }}
      >
        <div className="relative">
          {/* Looping pulse halo indicator */}
          {isCurrentActiveLoop && (
            <span className="absolute -inset-1.5 rounded-full animate-ping opacity-35 bg-emerald-500" />
          )}

          {/* Circular Avatar Container */}
          <div
            className={`${item.sizeClass} rounded-full overflow-hidden border-2 md:border-3 ${
              isCurrentActiveLoop
                ? 'ring-4 ring-emerald-500/80 scale-108 shadow-2xl border-white dark:border-slate-900'
                : 'border-white/90 dark:border-slate-800/90 shadow-lg'
            } ${opacityClass} transition-all duration-300 bg-slate-100 dark:bg-slate-800`}
          >
            <img
              src={item.image}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Left Flank - strictly on the left of the writings */}
      <div
        className="hidden lg:block pointer-events-none absolute left-0 top-0 bottom-0 w-60 xl:w-72 2xl:w-80 overflow-visible z-10"
        id="hero_avatar_left_flank"
      >
        <div className="relative w-full h-full">
          {LEFT_HERO_ITEMS.map((item, idx) => renderFlankItem(item, idx))}
        </div>
      </div>

      {/* Desktop Right Flank - strictly on the right of the writings */}
      <div
        className="hidden lg:block pointer-events-none absolute right-0 top-0 bottom-0 w-60 xl:w-72 2xl:w-80 overflow-visible z-10"
        id="hero_avatar_right_flank"
      >
        <div className="relative w-full h-full">
          {RIGHT_HERO_ITEMS.map((item, idx) => renderFlankItem(item, idx))}
        </div>
      </div>

      {/* Mobile & Tablet Compact Circular Loop Reel (visible on screens < lg) */}
      <div className="lg:hidden mt-8 px-4 w-full" id="hero_avatar_mobile_loop">
        {/* Horizontally scrolling avatar loop bar - clean small circles, no icons, no writings */}
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-2 pt-1 -mx-2 px-2">
          {HERO_LOOP_ITEMS.map((item, index) => {
            const isSelected = activeLoopIndex === index;
            return (
              <div
                key={`mobile-loop-${item.id}`}
                className={`relative shrink-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
                  isSelected ? 'scale-110' : 'opacity-85'
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 shadow-md ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-400'
                      : 'border-white dark:border-slate-800'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
