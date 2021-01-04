# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

import logging
from http import HTTPStatus

from diem.offchain import X_REQUEST_ID, X_REQUEST_SENDER_ADDRESS
from flask import Blueprint, request
from flask.views import MethodView
from wallet.services import offchain as offchain_service
from webapp.routes.strict_schema_view import (
    StrictSchemaView,
    response_definition,
    path_string_param,
    body_parameter,
)
from webapp.schemas import (
    PaymentCommands,
    PaymentCommand,
    FundsPullPreApprovalList,
    ApproveFundsPullPreApproval,
    Error,
)

logger = logging.getLogger(__name__)
offchain = Blueprint("offchain", __name__)


class CommandsRoutes:
    @classmethod
    def get_command_response_object(
        cls, approval: offchain_service.FundsPullPreApprovalCommands
    ):
        return {
            "address": approval.address,
            "biller_address": approval.biller_address,
            "funds_pre_approval_id": approval.funds_pre_approval_id,
            "scope": {
                "type": approval.scope_type,
                "expiration_time": approval.expiration_timestamp,
                "max_cumulative_amount": {
                    "unit": approval.max_cumulative_unit,
                    "value": approval.max_cumulative_unit_value,
                    "max_amount": {
                        "amount": approval.max_cumulative_amount,
                        "currency": approval.max_cumulative_amount_currency,
                    },
                },
                "max_transaction_amount": {
                    "amount": approval.max_transaction_amount,
                    "currency": approval.max_transaction_amount_currency,
                },
            },
            "description": approval.description,
            "status": approval.status,
        }


class OffchainRoutes:
    class OffchainView(StrictSchemaView):
        tags = ["Offchain"]

    class GetPaymentCommand(OffchainView):
        summary = "Get Payment Command"

        parameters = [
            path_string_param(
                name="transaction_id", description="transaction internal id"
            )
        ]

        responses = {
            HTTPStatus.OK: response_definition("Payment Command", schema=PaymentCommand)
        }

        def get(self, transaction_id: int):
            payment_command = offchain_service.get_payment_command_json(transaction_id)

            return (
                {"payment_command": payment_command},
                HTTPStatus.OK,
            )

    class GetAccountPaymentCommands(OffchainView):
        summary = "Get Account Payment Commands"

        responses = {
            HTTPStatus.OK: response_definition(
                "Account Payment Commands", schema=PaymentCommands
            )
        }

        def get(self):
            payment_commands = offchain_service.get_account_payment_commands(
                self.user.account_id
            )

            return (
                {"payment_commands": payment_commands},
                HTTPStatus.OK,
            )

    class GetFundsPullPreApprovals(OffchainView):
        summary = "Get funds pull pre approvals"

        responses = {
            HTTPStatus.OK: response_definition(
                "Funds pull pre approvals", schema=FundsPullPreApprovalList
            )
        }

        def get(self):
            approvals = offchain_service.get_funds_pull_pre_approvals(
                self.user.account_id
            )

            response = []

            for approval in approvals:
                command_reponse_object = CommandsRoutes.get_command_response_object(
                    approval
                )
                response.append(command_reponse_object)

            return (
                {"funds_pull_pre_approvals": response},
                HTTPStatus.OK,
            )

    class ApproveFundsPullPreApproval(OffchainView):
        summary = "Approve or reject incoming funds pull pre approval"
        parameters = [
            body_parameter(ApproveFundsPullPreApproval),
        ]
        responses = {
            HTTPStatus.NO_CONTENT: response_definition(
                "Request accepted. You should poll for command updates."
            ),
            HTTPStatus.NOT_FOUND: response_definition(
                "Command not found", schema=Error
            ),
        }

        def put(self):
            params = request.json

            funds_pre_approval_id: str = params["funds_pre_approval_id"]
            status: str = params["status"]

            try:
                offchain_service.approve_funds_pull_pre_approval(
                    funds_pre_approval_id, status
                )
            except offchain_service.FundsPullPreApprovalCommandNotFound:
                return self.respond_with_error(
                    HTTPStatus.NOT_FOUND,
                    f"Funds pre approval id {funds_pre_approval_id} was not found.",
                )

            return "OK", HTTPStatus.NO_CONTENT

    class EstablishFundsPullPreApproval(OffchainView):
        summary = "Establish funds pull pre approval by payer"

        def post(self):
            funds_pull_pre_approval = (
                offchain_service.establish_funds_pull_pre_approval()
            )

            return (
                {"funds_pull_pre_approval": funds_pull_pre_approval},
                HTTPStatus.OK,
            )

    class OffchainV2View(MethodView):
        def dispatch_request(self, *args, **kwargs):
            x_request_id = request.headers.get(X_REQUEST_ID)
            sender_address = request.headers.get(X_REQUEST_SENDER_ADDRESS)
            request_body = request.get_data()

            logger.info(f"[{sender_address}:{x_request_id}] offchain v2 income request")

            code, response = offchain_service.process_inbound_command(
                sender_address, request_body
            )

            logger.info(
                f"[{sender_address}:{x_request_id}] response: {code}, {response}"
            )

            return (response, code, {X_REQUEST_ID: x_request_id})
