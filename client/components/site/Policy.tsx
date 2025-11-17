import React from "react";

export default function Policy() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">
        Политика обработки персональных данных
      </h1>

      <p className="mb-4">
        Настоящая Политика обработки персональных данных (далее — Политика)
        регулирует обработку персональных данных пользователей сайта Manticon.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">1. Общие положения</h2>
      <p className="mb-4">
        Оператор обрабатывает персональные данные в соответствии с Федеральным
        законом №152-ФЗ «О персональных данных». Использование сайта означает
        согласие пользователя с настоящей Политикой.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">
        2. Состав обрабатываемых данных
      </h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Имя пользователя</li>
        <li>Ссылка на профиль в социальной сети (VK, TG и др.)</li>
        <li>Контактная информация, указанная добровольно</li>
        <li>Информация о регистрации на игровые столы</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">
        3. Цели обработки
      </h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Регистрация пользователя</li>
        <li>Связь с пользователем</li>
        <li>Функционирование игрового сервиса</li>
        <li>Отображение информации о пользователе в системе</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">
        4. Условия обработки и хранения
      </h2>
      <p className="mb-4">
        Персональные данные не передаются третьим лицам, за исключением
        требований законодательства. Данные хранятся в базе данных Оператора и
        защищены техническими средствами.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">5. Права пользователя</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Получать информацию о своих данных</li>
        <li>Требовать изменения или удаления данных</li>
        <li>Отзывать согласие на обработку</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">6. Контакты</h2>
      <p className="mb-4">
        По вопросам удаления или изменения данных можно обратиться по почте:{" "}
        <strong>afligirr@gmail.com</strong>
      </p>

      <p className="mt-10 text-sm text-gray-500">
        Последнее обновление политки — {new Date().toLocaleDateString("ru-RU")}.
      </p>
    </div>
  );
}
