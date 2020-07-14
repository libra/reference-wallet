// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from "react-i18next";
import React from "react";
import { LibraCurrencyBalance } from "../interfaces/account";
import { Text, ThemeConsumer } from "react-native-elements";
import { appTheme } from "../styles";
import { View } from "react-native";
import { FiatCurrency, Rates } from "../interfaces/currencies";
import { fiatToHumanFriendly, libraToFloat } from "../utils/amount-precision";
import { fiatCurrencies } from "../currencies";

interface TotalBalanceProps {
  balances: LibraCurrencyBalance[];
  fiatCurrencyCode: FiatCurrency;
  rates: Rates;
}

function TotalBalance({ balances, fiatCurrencyCode, rates }: TotalBalanceProps) {
  const { t } = useTranslation("layout");

  const fiatCurrency = fiatCurrencies[fiatCurrencyCode];

  const totalFiatBalance = balances.reduce((totalBalance, currencyBalance) => {
    const exchangeRate = rates[currencyBalance.currency][fiatCurrencyCode];
    totalBalance += libraToFloat(currencyBalance.balance) * exchangeRate;
    return totalBalance;
  }, 0);

  return (
    <ThemeConsumer<typeof appTheme>>
      {({ theme }) => (
        <View style={{ ...theme.Section, alignItems: "center" }}>
          <Text style={theme.Title}>
            {fiatCurrency.sign}
            {fiatToHumanFriendly(totalFiatBalance)} {fiatCurrency.symbol}
          </Text>
          <Text>{t("total_balance")}</Text>
        </View>
      )}
    </ThemeConsumer>
  );
}

export default TotalBalance;
