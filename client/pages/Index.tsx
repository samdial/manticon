import { useEffect, useMemo, useState } from "react";
import Hero from "@/components/site/Hero";
import GalleryRibbon from "@/components/site/GalleryRibbon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

export type GameTable = {
  id: string;
  master: string;
  system: string;
  description: string;
  freeSeats: number;
};

const STORAGE_KEY = "mantikon.tables.v1";

function generateInitialTables(): GameTable[] {
  const masters = [
    "Аристарх",
    "Белла",
    "Варг",
    "Грета",
    "Дарий",
    "Елена",
    "Жанна",
    "Земовит",
    "Илларион",
    "Ки��а",
    "Люций",
    "Милана",
    "Нестор",
    "Ольга",
    "Павел",
    "Рада",
    "Свят",
    "Тамара",
    "Ульяна",
    "Феликс",
    "Хельга",
    "Цезарь",
    "Чара",
    "Шандор",
    "Щука",
    "Элла",
    "Юлиан",
    "Яромир",
    "Мира",
    "Степан",
  ];
  const systems = [
    "D&D 5e",
    "Pathfinder 2e",
    "Call of Cthulhu",
    "Blades in the Dark",
    "Fate Core",
    "Savage Worlds",
  ];
  const themes = [
    "городское фэнтези",
    "космическая опера",
    "детективный хоррор",
    "плащи и кинжалы",
    "кл��ссическое приключение",
    "мистика и заговоры",
  ];

  const tables: GameTable[] = Array.from({ length: 30 }, (_, i) => {
    const m = masters[i % masters.length];
    const sys = systems[i % systems.length];
    const theme = themes[i % themes.length];
    const seats = 3 + ((i * 7) % 4); // 3..6 мест
    return {
      id: (i + 1).toString(),
      master: `Мастер ${m}`,
      system: sys,
      description: `Одноразовый сюжет на тему: ${theme}. Темп средний, упор на атмосферу и командную игру.`,
      freeSeats: seats,
    };
  });
  return tables;
}

export default function Index() {
  const [tables, setTables] = useState<GameTable[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameTable[];
        setTables(parsed);
        return;
      } catch {}
    }
    const initial = generateInitialTables();
    setTables(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }, []);

  useEffect(() => {
    if (tables.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }
  }, [tables]);

  const selectable = useMemo(
    () => tables.filter((t) => t.freeSeats > 0),
    [tables],
  );

  const morningTables = useMemo(() => tables.slice(0, 15), [tables]);
  const afternoonTables = useMemo(() => tables.slice(15, 30), [tables]);

  // Registration form state
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = tables.find((t) => t.id === selectedId);
    const ageNum = Number(age);

    if (!chosen) {
      toast({
        title: "Выберите стол",
        description: "Пожалуйста, выберите мастера со свободными местами.",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Введите имя",
        description: "Укажите ваше имя для регистрации.",
      });
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 6 || ageNum > 120) {
      toast({
        title: "Некорректный возраст",
        description: "Возраст должен быть от 6 до 120.",
      });
      return;
    }
    if (chosen.freeSeats <= 0) {
      toast({
        title: "��ест нет",
        description: "К сожалению, в этом столе уже нет мест.",
      });
      return;
    }

    try {
      const remainingSeats = chosen.freeSeats - 1;
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: ageNum,
          tableId: chosen.id,
          masterName: chosen.master,
          remainingSeats,
          system: chosen.system,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("Register request failed", err);
      toast({
        title: "Ошибка регистрации",
        description: "Не удалось отправить запрос. Попробуйте ещё раз.",
      });
      return;
    }

    setTables((prev) =>
      prev.map((t) =>
        t.id === chosen.id ? { ...t, freeSeats: t.freeSeats - 1 } : t,
      ),
    );

    toast({
      title: "Успех!",
      description: `${name} (${ageNum}) записан(а) к мастеру «${chosen.master}». Осталось мест: ${chosen.freeSeats - 1}.`,
    });

    setName("");
    setAge("");
  };

  return (
    <div>
      <Hero />

      <GalleryRibbon />

      <section id="about" className="container mt-12 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Анонсы и описание
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              «Мантикон» — ежегодный конвент настольных ролевых игр: десятки
              столов, новые системы и лучшие мастера. У нас — доброжелательное
              сообщество, насыщенная программа и комфортные зоны отдыха.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Место проведения: ДК «Пилигрим», Москва</li>
              <li>Даты: 20–22 сентября</li>
              <li>
                Формат: короткие сессии на 3–4 часа, приветствуются новички
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Важное
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Регистрация обязательна: места ограничены.</p>
            <p>• Возьмите документ — доступ в 16+ зоны по паспорту.</p>
            <p>
              • Приходите чуть раньше начала, чтобы не опаздывать к старту
              партии.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="lectures" className="container mt-12">
        <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-amber-900 dark:text-amber-100 mb-6">
          Лекции — суббота
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              time: "12:00",
              title: "Как вести первую НРИ",
              speaker: "Анна Воронова",
              desc: "Инструменты для старта: сессия ноль, безопаснос��ь и темп.",
            },
            {
              time: "13:30",
              title: "Миростроение без боли",
              speaker: "Илья Степанов",
              desc: "Практика создания сеттинга: карты, фракции, конфликты.",
            },
            {
              time: "15:00",
              title: "Импровизация мастера",
              speaker: "Сергей Лис",
              desc: "Приёмы импровизации, работа с идеями игроков.",
            },
            {
              time: "16:30",
              title: "Боёвка, которая не тормозит",
              speaker: "Кира Волкова",
              desc: "Динамичные сцены, инициативы и ясные ходы.",
            },
            {
              time: "18:00",
              title: "Хоррор у стола",
              speaker: "Дмитрий Чернов",
              desc: "Атмосфера, безопасность, звуковой дизайн и свет.",
            },
            {
              time: "19:30",
              title: "Инди‑системы 2025",
              speaker: "Влад Мариус",
              desc: "Обзор свежих правил и где их найти.",
            },
          ].map((l, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="shrink-0 rounded-md bg-primary/10 text-primary px-3 py-2 font-semibold">
                  {l.time}
                </div>
                <div>
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Спикер: {l.speaker}
                  </div>
                  <p className="mt-2 text-sm">{l.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="tables" className="container mt-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Игровые столы — воскресенье
          </h2>
          <div className="text-sm text-muted-foreground">
            Свободные места: {tables.reduce((a, t) => a + t.freeSeats, 0)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Сессии 10:30–15:00 и с 15:00.
        </p>

        <Tabs defaultValue="morning">
          <TabsList>
            <TabsTrigger value="morning">10:30–15:00</TabsTrigger>
            <TabsTrigger value="afternoon">с 15:00</TabsTrigger>
          </TabsList>

          <TabsContent value="morning">
            <div className="hidden md:block overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 w-[22%]">Мастер</th>
                    <th className="px-4 py-3 w-[18%]">Система</th>
                    <th className="px-4 py-3">Краткое описание</th>
                    <th className="px-4 py-3 w-[14%]">Свободных мест</th>
                  </tr>
                </thead>
                <tbody>
                  {morningTables.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{t.master}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.system}
                      </td>
                      <td className="px-4 py-3">{t.description}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                            t.freeSeats > 0
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {t.freeSeats}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden grid gap-3 mt-3">
              {morningTables.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{t.master}</div>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          t.freeSeats > 0
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.freeSeats}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.system}
                    </div>
                    <p className="text-sm">{t.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="afternoon">
            <div className="hidden md:block overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 w-[22%]">Мастер</th>
                    <th className="px-4 py-3 w-[18%]">Система</th>
                    <th className="px-4 py-3">Краткое описание</th>
                    <th className="px-4 py-3 w-[14%]">Свободных мест</th>
                  </tr>
                </thead>
                <tbody>
                  {afternoonTables.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{t.master}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.system}
                      </td>
                      <td className="px-4 py-3">{t.description}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                            t.freeSeats > 0
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {t.freeSeats}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden grid gap-3 mt-3">
              {afternoonTables.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{t.master}</div>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          t.freeSeats > 0
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.freeSeats}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.system}
                    </div>
                    <p className="text-sm">{t.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section id="register" className="container mt-12 mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Регистрация на игру
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleRegister}
              className="grid gap-4 md:grid-cols-4"
            >
              <div className="md:col-span-2">
                <Label htmlFor="master">Выбор мастера</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger
                    id="master"
                    className="mt-1"
                    aria-label="Выберите стол"
                  >
                    <SelectValue placeholder="Выберите стол с местами" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectable.length === 0 ? (
                      <SelectItem disabled value="none">
                        Мест нет
                      </SelectItem>
                    ) : (
                      selectable.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.master} • {t.system} • мест: {t.freeSeats}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <Label htmlFor="age">Возраст</Label>
                <Input
                  id="age"
                  className="mt-1"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Например, 18"
                  inputMode="numeric"
                />
              </div>
              <div className="md:col-span-4">
                <Button type="submit" className="w-full md:w-auto">
                  Записаться
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section id="sponsors" className="container mt-12 mb-20">
        <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-amber-900 dark:text-amber-100 mb-6 text-center">
          Спонсоры
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Таверна Мудреца",
              description: "Сеть кафе настольных игр",
              image:
                "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "DragonSkull Games",
              description: "Издатель настольных ролевых игр",
              image:
                "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Экспедиция",
              description: "Туристическое агентство",
              image:
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Райские Миры",
              description: "Специализированны�� магазин",
              image:
                "https://images.unsplash.com/photo-1570303540540-25e0e5b2eb9a?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Ночной Орден",
              description: "Баланс игровых правил",
              image:
                "https://images.unsplash.com/photo-1552765069-5c63e89b51c7?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Легенда",
              description: "Сообщество неклассических RPG",
              image:
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
          ].map((sponsor, i) => (
            <a
              key={i}
              href={sponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800">
                <div className="overflow-hidden h-40">
                  <img
                    src={sponsor.image}
                    alt={sponsor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-1">
                    {sponsor.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sponsor.description}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
