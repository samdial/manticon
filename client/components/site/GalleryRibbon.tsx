import { useCallback, useState } from "react";
import useEmblaCarousel, { EmblaOptionsType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const images: { src: string; alt: string }[] = [
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F7a1b5e74e7c041aa802c48394a1a2df8?format=webp&width=800",
    alt: "Участники на праздничном событии с украшениями",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F368246fec6894a7fbcb6e31845d3e8ff?format=webp&width=800",
    alt: "Игроки за столом с бумагами и ноутбуком",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F73f890b0b94f4661a2cafbd17eb5894d?format=webp&width=800",
    alt: "Человек с моделью дракона на событии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fa0a23417403b4a068185ef1252037dbf?format=webp&width=800",
    alt: "Участники в костюмах перед фотобором",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F7bbf6ad2ae02420f8560a6198dc042fc?format=webp&width=800",
    alt: "Ведущий с микрофоном на сцене",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F915b4ca7a4c3422f80a6715da338ebbc?format=webp&width=800",
    alt: "Фотография с праздничного события",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F4ba82fb818044ceba568b47c25f41d1b?format=webp&width=800",
    alt: "Участники прово��ят игровой сеанс",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fcb0a2e28b9084f62aaca49f2e1361a50?format=webp&width=800",
    alt: "Люди в костюмах на мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fa801e1b574f447f9821fd104a90b2840?format=webp&width=800",
    alt: "Игроки за столом во время игровой сессии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F14028a8fe50c4fdabc2a304e82cd548e?format=webp&width=800",
    alt: "Участники события в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F3717dcd6296545f7ae21b45e313d7328?format=webp&width=800",
    alt: "Игровой сеанс с участниками",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fc19eb8adbfa242ecaeedff0f758419f8?format=webp&width=800",
    alt: "Участники за игровым столом",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fb74a5f1a011f40a49c73d0bc943e73e3?format=webp&width=800",
    alt: "Люди на праздничном мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fadeabf041c164ff79be9801fbcf67dac?format=webp&width=800",
    alt: "Группа участников события",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F5acc263085a9488dab9b0fb995b772f0?format=webp&width=800",
    alt: "Участники проводят игровой сеанс в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F45e5e8244ebe42d4ac868ac95419df7d?format=webp&width=800",
    alt: "Люди за столом на мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fcce4be28cfe6494e86040f563292a02c?format=webp&width=800",
    alt: "Участники праздничного события",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fb4faca38775b4483849b106c26d4b347?format=webp&width=800",
    alt: "Люди в костюмах на фотобором",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Ffe8b00684acc470a9c97fc7e8cf9539f?format=webp&width=800",
    alt: "Участник события в уникальном наряде",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fe338cefbf5104dd991b2c386500f7650?format=webp&width=800",
    alt: "Игровой сеанс с материалами и кубиками",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F7bfedc7e4de34a1cbea5d3325e57953f?format=webp&width=800",
    alt: "Люди на игровом столе",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F09c4763a258546118c7d4bde4fe70ab5?format=webp&width=800",
    alt: "Участники мероприятия в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F1e5a1400d8d6442fb2b71df3ddfbb404?format=webp&width=800",
    alt: "Люди за столом во время мероприятия",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F4515f15428f544db93afedec55319dee?format=webp&width=800",
    alt: "Игровая сессия с участниками",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F788f3e4a9fb44cfcb21c5b264da1cdf8?format=webp&width=800",
    alt: "Участники на праздничном мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fd0c05ac5258145138cfd905f853d4528?format=webp&width=800",
    alt: "Люди общаются на событии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F5f7e196ae60e4f2b85817597a0a15adf?format=webp&width=800",
    alt: "Участники события в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F60c7910568d940c69a24c7fdc3d434c0?format=webp&width=800",
    alt: "Люди на игровом столе с материалами",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F3ddc37936f044319ba22664fbcce17a9?format=webp&width=800",
    alt: "Люди в костюмах на мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F7bd846409ecd45779c8792e6f9df5006?format=webp&width=800",
    alt: "Участники события перед фоном",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F81bd86448f9b49f09a0dc6295c691667?format=webp&width=800",
    alt: "Люди на праздничном событии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F5aa4078c91d54e90809877c5834af37b?format=webp&width=800",
    alt: "Игровая сессия на столе",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fc9b47a76e8704dca8d5967a83470ccda?format=webp&width=800",
    alt: "Участники мероприятия с декорациями",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F187a9abc0cd54df7aa6e87ff8fe3df8b?format=webp&width=800",
    alt: "Люди на событии в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F108aa0fa21de45bfb6304747b2b84a40?format=webp&width=800",
    alt: "Участники праздничного события",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fd6930fb82f68486db03429b6d38275dd?format=webp&width=800",
    alt: "Люди на игровом столе",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F35ed22b33d554840bc92345a612e8d16?format=webp&width=800",
    alt: "Участники события на меропр��ятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F4f12f2c5f8644df98d28bb0ef77a7fa2?format=webp&width=800",
    alt: "Люди в костюмах перед камерой",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F29aa397c72b74de69390ccaa24c53ead?format=webp&width=800",
    alt: "Участники праздничного события",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fc296da8232e048eea5d8f11a5a567a53?format=webp&width=800",
    alt: "Люди за столом с игровыми материалами",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fb23089522e7e41789022987917c6c0ab?format=webp&width=800",
    alt: "Группа участников на мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F7c71eb7b3a2e4c5e8d6c5624c4a665c8?format=webp&width=800",
    alt: "Люди на событии в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fb164c0cfbe514afe81f6c28cb577264f?format=webp&width=800",
    alt: "Участники события на фотобором",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F627e269c239147c88e9502a820d4e62c?format=webp&width=800",
    alt: "Люди на праздничном мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fd6a7e31e400b4a73bacd6b7bf6a28c97?format=webp&width=800",
    alt: "Участники события в интерьере",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fc4cf5c1f1f8144208518219e362e9eb7?format=webp&width=800",
    alt: "Люди на игровом мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fc5e6f0d1849d4088bd4cdb6971d03c47?format=webp&width=800",
    alt: "Участники праздничного события",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F75b02351523646fd8a36653f91c8e09f?format=webp&width=800",
    alt: "Люди перед фотобором",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Fc042a24bd4ed4ba695b3b1dc6bad68da?format=webp&width=800",
    alt: "Участники события на мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F47c214b591074827956ae0b79f840573?format=webp&width=800",
    alt: "Люди на праздничном событии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F69f1e77110a449238ba029a9cdc8ff2b?format=webp&width=800",
    alt: "Участники в костюмах на мероприятии",
  },
  {
    src: "https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2Ffbec125fcdf844c79d744a5791106af8?format=webp&width=800",
    alt: "Люди на событии",
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  return (
    <>
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
                  className="relative shrink-0 w-[68%] xs:w-[60%] sm:w-[45%] md:w-[32%] lg:w-[24%] aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                  whileHover={{ scale: 1.03, rotate: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0.6, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  onClick={() => handleImageClick(i)}
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

      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] w-[90%] h-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <button
                onClick={closeModal}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
                aria-label="Закрыть"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={images[selectedImageIndex].src}
                alt={images[selectedImageIndex].alt}
                className="w-full h-auto object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
