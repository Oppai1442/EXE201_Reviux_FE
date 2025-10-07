import React from "react";
import { useTranslation, Trans } from "react-i18next";

const ToSPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{t("tos.title")}</h1>
        <p className="text-sm text-gray-400 mb-8">{t("tos.lastUpdated")}</p>
        <p className="text-lg text-gray-300 mb-12">
          <Trans i18nKey="tos.intro" />
        </p>

        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <section key={i} className="mb-10">
            <h2 className="text-2xl font-semibold text-red-500 mb-2">
              {t(`tos.section${i}.title`)}
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {t(`tos.section${i}.content`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ToSPage;