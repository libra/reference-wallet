// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from "react";
import { Badge, Button } from "reactstrap";
import { useTranslation } from "react-i18next";
import { settingsContext } from "../../contexts/app";
import {
  fiatToHumanFriendly,
  fiatToHumanFriendlyRate,
  libraToHumanFriendly,
} from "../../utils/amount-precision";
import { Quote } from "../../interfaces/cico";
import { paymentMethodsLabels } from "../../interfaces/user";

interface DepositReviewProps {
  quote: Quote;
  fundingSourceId: number;
  submitting: boolean;
  submitted: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onComplete: () => void;
}

function DepositReview({
  quote,
  fundingSourceId,
  submitting,
  submitted,
  onBack,
  onConfirm,
  onComplete,
}: DepositReviewProps) {
  const { t } = useTranslation("transfer");
  const [settings] = useContext(settingsContext)!;

  const fundingSource = settings.paymentMethods!.find(
    (paymentMethod) => paymentMethod.id == fundingSourceId
  )!;

  const [libraCode, fiatCode] = quote.rfq.currency_pair.split("_");

  const libraCurrency = settings.currencies[libraCode];
  const fiatCurrency = settings.fiatCurrencies[fiatCode];

  const exchangeRate = libraCurrency.rates[fiatCode];

  return (
    <>
      <h3>{t("deposit.review.title")}</h3>
      <p>{t("deposit.review.description")}</p>

      <div>
        <small>{t("deposit.review.funding_source")}</small>
        <p className="text-black">
          {fundingSource.name} <Badge>{paymentMethodsLabels[fundingSource.provider]}</Badge>
        </p>
      </div>

      <div>
        <small>{t("deposit.review.price")}</small>
        <p className="text-black">
          {fiatCurrency.sign}
          {fiatToHumanFriendly(quote.price, true)} {fiatCurrency.symbol}
        </p>
      </div>

      <div>
        <small>{t("deposit.review.amount")}</small>
        <p className="text-black">
          {libraToHumanFriendly(quote.rfq.amount, true)} {libraCurrency.sign}
        </p>
      </div>

      <div>
        <small>{t("deposit.review.exchange_rate")}</small>
        <p className="text-black">
          1 {libraCurrency.sign} = {fiatToHumanFriendlyRate(exchangeRate)} {fiatCurrency.symbol}
        </p>
      </div>

      {!submitted && (
        <>
          <Button color="black" block onClick={onConfirm} disabled={submitting}>
            {submitting ? <i className="fa fa-spin fa-spinner" /> : t("deposit.review.confirm")}
          </Button>
          <Button outline color="black" block onClick={onBack} disabled={submitting}>
            {t("deposit.review.back")}
          </Button>
        </>
      )}
      {submitted && (
        <Button outline color="black" block onClick={onComplete}>
          {t("deposit.review.done")}
        </Button>
      )}
    </>
  );
}

export default DepositReview;
