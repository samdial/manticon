import { useCallback } from "react";
import useEmblaCarousel, { EmblaOptionsType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const images: { src: string; alt: string }[] = [
  {
    src: "https://images.unsplash.com/photo-1617806118233-18e1df0d9015?q=80&w=1600&auto=format&fit=crop",
    alt: "Кубики d20 крупным планом",
  },
  {
    src: "https://images.unsplash.com/photo-1602802943152-c9d4a0b37c29?q=80&w=1600&auto=format&fit=crop",
    alt: "Фэнтези карта мира и миниатюры",
  },
  {
    src: "https://images.unsplash.com/photo-1553484771-2d2d63c6e04b?q=80&w=1600&auto=format&fit=crop",
    alt: "Игровой стол и свечи",
  },
  {
    src: "https://images.unsplash.com/photo-1596496181848-3091d4878b47?q=80&w=1600&auto=format&fit=crop",
    alt: "Ролевые книги и кубики",
  },
  {
    src: "https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?q=80&w=1600&auto=format&fit=crop",
    alt: "Игровые фишки и аксессуары",
  },
  {
    src: "https://images.unsplash.com/photo-1522826657326-0466ba28c41f?q=80&w=1600&auto=format&fit=crop",
    alt: "Команда за столом",
  },
  {
    src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1600&auto=format&fit=crop",
    alt: "Красивая иллюстрация фэнтези",
  },
  {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&auto=format&fit=crop",
    alt: "Атмосфера и свет",
  },
  {
    src: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=1600&auto=format&fit=crop",
    alt: "Декорации и книги",
  },
  {
    src: "https://images.unsplash.com/photo-1520975922284-9d1e8a4fd814?q=80&w=1600&auto=format&fit=crop",
    alt: "Герои и артефакты",
  },
  {
    src: "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=1600&auto=format&fit=crop",
    alt: "Миниатюры на поле",
  },
  {
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1600&auto=format&fit=crop",
    alt: "Кубики d6 на столе",
  },
];

const options: EmblaOptionsType = {
  align: "start",
  containScroll: "trimSnaps",
  dragFree: true,
  loop: false,
};

export default function GalleryRibbon() {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="container mt-6 md:mt-10" aria-label="Фотолента">
      <div className="relative rounded-xl border bg-card/60">
        <div
          className="overflow-hidden rounded-xl"
          ref={emblaRef}
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div className="flex gap-3 p-3">
            {images.map((img, i) => (
              <motion.div
                key={i}
                className="relative shrink-0 w-[68%] xs:w-[60%] sm:w-[45%] md:w-[32%] lg:w-[24%] aspect-[4/3] rounded-lg overflow-hidden"
                whileHover={{ scale: 1.03, rotate: 0.2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0.6, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Назад"
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow border hover:bg-accent/70 backdrop-blur transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Вперёд"
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow border hover:bg-accent/70 backdrop-blur transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
