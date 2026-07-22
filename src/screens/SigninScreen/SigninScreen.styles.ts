import { StyleSheet } from "react-native";
import theme from "@/modules/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 3,
    zIndex: 999,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  input: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.field,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.danger,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  signinButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    paddingVertical: 16,
  },
  signinButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disabledSigninButton: {
    backgroundColor: theme.colors.textDisabled,
  },
  signingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonContainer: {
    flexDirection: "row",
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
});

export default styles;
