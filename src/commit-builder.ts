import { BetterCommitsConfig, CommitState } from "./types";

/**
 * Build the full commit message string from the commit state and config.
 * Ported from better-commits CLI `build_commit_string`.
 */
export function buildCommitString(
  state: CommitState,
  config: BetterCommitsConfig
): string {
  let result = "";

  // Type
  if (state.type) {
    result += state.type;
  }

  // Scope
  if (state.scope) {
    result += `(${state.scope})`;
  }

  // Ticket (for title positioning)
  let titleTicket = state.ticket;
  const surround = config.check_ticket.surround;
  if (state.ticket && surround) {
    const open = surround.charAt(0);
    const close = surround.charAt(1);
    titleTicket = `${open}${state.ticket}${close}`;
  }

  const addToTitle = config.check_ticket.add_to_title;
  const position = config.check_ticket.title_position;

  // Ticket at "beginning" (before everything)
  if (titleTicket && addToTitle && position === "beginning") {
    result = `${titleTicket} ${result}`;
  }

  // Ticket "before-colon"
  if (titleTicket && addToTitle && position === "before-colon") {
    const spacing =
      state.scope || (state.type && !config.check_ticket.surround) ? " " : "";
    result += spacing + titleTicket;
  }

  // Breaking change exclamation
  if (state.breaking_title && config.breaking_change.add_exclamation_to_title) {
    result += "!";
  }

  // Colon separator
  if (
    state.scope ||
    state.type ||
    (titleTicket && position === "before-colon")
  ) {
    result += ": ";
  }

  // Ticket at "start" (after colon)
  if (titleTicket && addToTitle && position === "start") {
    result += titleTicket + " ";
  }

  // Title
  if (state.title) {
    result += state.title;
  }

  // Ticket at "end"
  if (titleTicket && addToTitle && position === "end") {
    result += " " + titleTicket;
  }

  // Body
  if (state.body) {
    result += `\n\n${state.body}`;
  }

  // Breaking change
  if (state.breaking_title) {
    result += `\n\nBREAKING CHANGE: ${state.breaking_title}`;
  }
  if (state.breaking_body) {
    result += `\n\n${state.breaking_body}`;
  }

  // Deprecated
  if (state.deprecates_title) {
    result += `\n\nDEPRECATED: ${state.deprecates_title}`;
  }
  if (state.deprecates_body) {
    result += `\n\n${state.deprecates_body}`;
  }

  // Custom footer
  if (state.custom_footer) {
    result += `\n\n${state.custom_footer}`;
  }

  // Closes
  if (state.closes && state.ticket) {
    result += `\n\n${state.closes} ${state.ticket}`;
  }

  // Trailer
  if (state.trailer) {
    result += `\n\n${state.trailer}`;
  }

  return result;
}

/**
 * Clean a commit title: trim and remove trailing period.
 */
export function cleanCommitTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed.endsWith(".") ? trimmed.slice(0, -1).trim() : trimmed;
}
