// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from "react-i18next";
import React, { useContext } from "react";
import { settingsContext } from "../contexts/app";
import { fiatToHumanFriendly, libraToFloat } from "../utils/amount-precision";

function TotalBalance() {
  const { t } = useTranslation("layout");
  const [settings] = useContext(settingsContext)!;

  if (!settings.account) {
    return null;
  }

  const fiatCurrency = settings.fiatCurrencies[settings.defaultFiatCurrencyCode!];

  const totalFiatBalance = settings.account.balances.reduce((totalBalance, currencyBalance) => {
    const exchangeRate =
      settings.currencies[currencyBalance.currency].rates[settings.defaultFiatCurrencyCode!];
    totalBalance += libraToFloat(currencyBalance.balance) * exchangeRate;
    return totalBalance;
  }, 0);

  return (
    <>
      <div className="h3 m-0">
        {fiatCurrency.sign}
        {fiatToHumanFriendly(totalFiatBalance, true)} {fiatCurrency.symbol}
      </div>
      {t("total_balance")}
    </>
  );
}

export default TotalBalance;
