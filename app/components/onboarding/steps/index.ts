import React, { type ReactNode } from "react";
import { ChoiceStep } from "./ChoiceStep";
import { JoinEmailStep } from "./JoinEmailStep";
import { AccessRequestSentStep } from "./AccessRequestSentStep";

export type StepId =
  | "choice"
  | "join_email"
  | "access_request_sent";

export type OnboardingFlowState = {
  selectedOption: "join" | "create" | null;
  joinEmailInput: string;
  joinEmails: string[];
};

export type OnboardingStepProps = {
  state: OnboardingFlowState;
  setState: (patch: Partial<OnboardingFlowState>) => void;
};

export type OnboardingStepDefinition = {
  id: StepId;
  render: (props: OnboardingStepProps) => ReactNode;
  canGoNext: (state: OnboardingFlowState) => boolean;
  getTitle?: (ctx: { userName: string }) => string;
  getSubtitle?: (ctx: { userName: string }) => string | undefined;
};

export const onboardingSteps: OnboardingStepDefinition[] = [
  {
    id: "choice",
    render: (props) => React.createElement(ChoiceStep, props),
    canGoNext: (state) => state.selectedOption === "join",
    getTitle: ({ userName }) => `Bienvenido, ${userName}`,
    getSubtitle: () =>
      "Cuéntanos algo más sobre tu situación para conectar tu cuenta correctamente.",
  },

  {
    id: "join_email",
    render: (props) => React.createElement(JoinEmailStep, props),
    canGoNext: (state) => state.joinEmails.length > 0,
    getTitle: () => "Ayúdanos a localizar tu empresa",
    getSubtitle: () =>
      "Añade correos de personas de tu empresa para solicitar acceso.",
  },

  {
    id: "access_request_sent",
    render: () => React.createElement(AccessRequestSentStep),
    canGoNext: () => false,
    getTitle: () => "Solicitud enviada",
    getSubtitle: () => undefined,
  },
];

export const initialOnboardingState: OnboardingFlowState = {
  selectedOption: null,
  joinEmailInput: "",
  joinEmails: [],
};
