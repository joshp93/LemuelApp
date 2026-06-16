import { useRouter } from "expo-router";
import type React from "react";
import { useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { remoteLog } from "../api/remote-logger";
import { useAuth } from "../auth/auth-context";
import { DividingLine } from "./dividing-line";
import { LemuelButton } from "./lemuel-button";

/**
 * Slide-in drawer menu from the right side of the header.
 * Shows navigation items and an email button for the account page
 * when the user is authenticated.
 */
export function HeaderMenu({ children }: { children?: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(300));
  const router = useRouter();
  const { user, signOut } = useAuth();

  const openMenu = () => {
    remoteLog("debug", "[HeaderMenu] Menu opened", {
      authenticated: !!user,
    });
    setVisible(true);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: 300,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setVisible(false);
    });
  };

  const navigateTo = (path: string) => {
    remoteLog("debug", "[HeaderMenu] Navigating", { path });
    closeMenu();
    router.push(path as any);
  };

  const handleSignOut = () => {
    remoteLog("info", "[HeaderMenu] Signing out");
    closeMenu();
    signOut();
  };

  return (
    <>
      <Pressable
        onPress={openMenu}
        style={styles.burger}
        testID="burger-button"
      >
        {children}
        <View style={styles.burgerIcon}>
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Animated.View
            style={[
              styles.drawerMenu,
              { transform: [{ translateX: slideAnimation }] },
            ]}
          >
            <View style={styles.menuContent}>
              <View style={styles.topItems}>
                {user && (
                  <>
                    <LemuelButton
                      onPress={() => navigateTo("/account")}
                      style={styles.emailButton}
                      size="sm"
                    >
                      {user.email}
                    </LemuelButton>
                    <DividingLine />
                  </>
                )}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/")}
                >
                  <Text style={styles.menuText}>Home</Text>
                </TouchableOpacity>
                {user && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo(`/notes/users/${user.userId}`)}
                  >
                    <Text style={styles.menuText}>Meditations</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/settings")}
                >
                  <Text style={styles.menuText}>Settings</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomSection}>
                <DividingLine />
                {user ? (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleSignOut}
                  >
                    <Text style={styles.signOutText}>Sign Out</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo("/email-entry")}
                  >
                    <Text style={styles.signInText}>Sign In</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 8,
    height: 40,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 30,
  },
  burgerIcon: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  burgerLine: {
    width: 20,
    height: 2,
    backgroundColor: "white",
    marginVertical: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawerMenu: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "white",
    boxShadow: "-2px 0 4px rgba(0, 0, 0, 0.25)",
  },
  menuContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  topItems: {
    flexShrink: 1,
  },
  emailButton: {
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  bottomSection: {
    flexShrink: 0,
  },
  signOutText: {
    fontSize: 16,
    color: "#dc3545",
    fontWeight: "500",
  },
  signInText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
});
