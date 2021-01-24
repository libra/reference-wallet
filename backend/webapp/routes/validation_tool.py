from http import HTTPStatus

from diem import offchain
from flask import Blueprint, request
from wallet.services import validation_tool as validation_tool_service
from webapp.schemas import (
    FundsPullPreApprovalId,
    FundsPullPreApprovalRequest,
    FundsPullPreApprovalData,
)

from .strict_schema_view import StrictSchemaView, response_definition, body_parameter

validation_tool = Blueprint("validation_tool", __name__)


class ValidationToolRoutes:
    class ValidationToolView(StrictSchemaView):
        tags = ["ValidationTool"]

    class CreateFundsPullPreApprovalRequest(ValidationToolView):
        summary = "Send funds pull pre-approval request to another VASP"
        parameters = [
            body_parameter(FundsPullPreApprovalRequest),
        ]
        responses = {
            HTTPStatus.OK: response_definition(
                "ID of the new funds_pull_pre_approval object",
                schema=FundsPullPreApprovalId,
            )
        }

        def post(self):
            user = self.user
            request_details = request.json

            payer_address = request_details["payer_address"]
            description = request_details.get("description")

            scope = get_scope_from_request_details(request_details)

            funds_pull_pre_approval_id = (
                validation_tool_service.request_funds_pull_pre_approval_from_another(
                    account_id=user.account_id,
                    payer_address=payer_address,
                    scope=scope,
                    description=description,
                )
            )

            return (
                {"funds_pull_pre_approval_id": funds_pull_pre_approval_id},
                HTTPStatus.OK,
            )

    class CreateFundsPullPreApprovalData(ValidationToolView):
        summary = "Save funds pull pre-approval data without sending it through offchain"
        parameters = [
            body_parameter(FundsPullPreApprovalData),
        ]
        responses = {
            HTTPStatus.OK: response_definition(
                "ID of the new funds_pull_pre_approval object",
                schema=FundsPullPreApprovalId,
            )
        }

        def post(self):
            user = self.user
            request_details = request.json

            description = request_details.get("description")

            scope = get_scope_from_request_details(request_details)

            funds_pull_pre_approval_id = validation_tool_service.create_funds_pull_pre_approval_data(
                account_id=user.account_id,
                scope=scope,
                description=description,
            )

            return (
                {"funds_pull_pre_approval_id": funds_pull_pre_approval_id},
                HTTPStatus.OK,
            )


def get_scope_from_request_details(request_details):
    max_cumulative_amount = (
        offchain.ScopedCumulativeAmountObject(
            unit=request_details["scope"]["max_cumulative_amount"]["unit"],
            value=request_details["scope"]["max_cumulative_amount"]["value"],
            max_amount=offchain.CurrencyObject(
                **request_details["scope"]["max_cumulative_amount"]["max_amount"]
            ),
        )
        if "max_cumulative_amount" in request_details["scope"]
        else None
    )
    max_transaction_amount = (
        offchain.CurrencyObject(**request_details["scope"]["max_transaction_amount"])
        if "max_transaction_amount" in request_details["scope"]
        else None
    )

    return offchain.FundPullPreApprovalScopeObject(
        type=request_details["scope"]["type"],
        expiration_timestamp=request_details["scope"]["expiration_timestamp"],
        max_cumulative_amount=max_cumulative_amount,
        max_transaction_amount=max_transaction_amount,
    )
