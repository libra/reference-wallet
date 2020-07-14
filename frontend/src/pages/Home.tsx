// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useState } from "react";
import { Container } from "reactstrap";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { settingsContext } from "../contexts/app";
import { LibraCurrency } from "../interfaces/currencies";
import { RegistrationStatus } from "../interfaces/user";
import { Transaction } from "../interfaces/transaction";
import VerifyingMessage from "../components/VerifyingMessage";
import TotalBalance from "../components/TotalBalance";
import Actions from "../components/Actions";
import BalancesList from "../components/BalancesList";
import SendModal from "../components/Send/SendModal";
import ReceiveModal from "../components/ReceiveModal";
import TransferModal from "../components/TransferModal";
import WalletLoader from "../components/WalletLoader";
import TransactionsList from "../components/TransactionsList";
import BackendClient from "../services/backendClient";
import AdminHome from "../components/admin/AdminHome";
import TransactionModal from "../components/TransactionModal";
import { fiatToHumanFriendly } from "../utils/amount-precision";

const REFRESH_TRANSACTIONS_INTERVAL = 3000;

function Home() {
  const { t } = useTranslation("layout");
  const [settings] = useContext(settingsContext)!;
  const user = settings.user;

  const userVerificationRequired =
    user &&
    [RegistrationStatus.Registered, RegistrationStatus.Verified].includes(
      user.registration_status as RegistrationStatus
    );

  const [activeCurrency, setActiveCurrency] = useState<LibraCurrency | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionModal, setTransactionModal] = useState<Transaction>();

  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [sendModalOpen, setSendModalOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function refreshUser() {
      try {
        await new BackendClient().refreshUser();
      } catch (e) {
        console.error(e);
      }
    }
    // noinspection JSIgnoredPromiseFromCall
    refreshUser();
  }, []);

  let pageContent = <WalletLoader />;

  if (user) {
    if (user.registration_status !== "Approved") {
      // Not verified user
      pageContent = <VerifyingMessage />;
    } else {
      // Verified admin user
      if (user.is_admin) {
        pageContent = <AdminHome />;
      } else {
        // Verified normal user
        pageContent = (
          <>
            <h1 className="h5 font-weight-normal text-body text-center">
              {user.first_name} {user.last_name}
            </h1>

            <section className="my-5 text-center">
              <TotalBalance />
            </section>

            <section className="my-5 text-center">
              <Actions
                onSendClick={() => setSendModalOpen(true)}
                onRequestClick={() => setReceiveModalOpen(true)}
                onTransferClick={() => setTransferModalOpen(true)}
              />
            </section>

            <section className="my-5">
              <h2 className="h5 font-weight-normal text-body">{t("balances")}</h2>
              <BalancesList balances={settings.account?.balances!} onSelect={setActiveCurrency} />
            </section>

            {!!transactions.length && (
              <section className="my-5">
                <h2 className="h5 font-weight-normal text-body">{t("transactions")}</h2>
                <TransactionsList
                  transactions={transactions}
                  bottom={
                    <Link to="/transactions" className="text-black font-weight-bold">
                      {t("all_transactions_link")}
                    </Link>
                  }
                  onSelect={(transaction) => {
                    setTransactionModal(transaction);
                  }}
                />
                <TransactionModal
                  open={!!transactionModal}
                  onClose={() => setTransactionModal(undefined)}
                  transaction={transactionModal}
                />
              </section>
            )}

            <SendModal open={sendModalOpen} onClose={() => setSendModalOpen(false)} />
            <ReceiveModal open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} />
            <TransferModal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
          </>
        );
      }
    }
  }

  let refreshTransactions = true;

  const fetchTransactions = async () => {
    try {
      if (refreshTransactions) {
        setTransactions(
          await new BackendClient().getTransactions(undefined, undefined, undefined, 10)
        );
        setTimeout(fetchTransactions, REFRESH_TRANSACTIONS_INTERVAL);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // noinspection JSIgnoredPromiseFromCall
    fetchTransactions();

    return () => {
      refreshTransactions = false;
    };
  }, []);

  return (
    <>
      {userVerificationRequired && <Redirect to="/verify" />}
      {!!activeCurrency && <Redirect to={"/wallet/" + activeCurrency} />}
      <Container className="py-5">{pageContent}</Container>
    </>
  );
}

export default Home;
