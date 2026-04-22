import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Layout } from '../constants/layout';
import { useTheme } from '../theme/useTheme';

export function AboutDeveloperScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="About Shelter Aid and the developer"
    >


      <Section title="About this app" theme={theme}>
        <Text style={[styles.body, { color: theme.colors.text }]}>
          Find emergency shelter, housing, food, and medical resources in one place—search or map,
          save favorites on this device, and call or get directions fast when you need help.
        </Text>
      </Section>

      <Section title="About the developer" theme={theme}>
        <Text
          style={[styles.devName, { color: theme.colors.primary }]}
          accessibilityRole="header"
        >
          Abhimanyu Kaushik
        </Text>
        <Text style={[styles.body, { color: theme.colors.text }]}>
          Abhimanyu is a student with a deep interest in computer science and in using technology as
          a tool for real-world impact. He is drawn to problems that affect everyday people—especially
          those who are underserved—and enjoys turning complex, messy challenges into clear,
          approachable solutions.
        </Text>
        <Text style={[styles.body, styles.bodyGap, { color: theme.colors.text }]}>
          Shelter Aid grew out of that mindset: a purposeful project focused on dignity, access, and
          practical help. By combining maps, search, and thoughtful design, he aims to make critical
          resource information easier to discover when stress is high and time is short.
        </Text>
        <Text style={[styles.body, styles.bodyGap, { color: theme.colors.text }]}>
          Whether through coursework, side projects, or civic-minded apps like this one, Abhimanyu
          continues to build skills in software development while keeping people—not just code—at the
          center of the work. Shelter Aid reflects both his technical curiosity and his commitment to
          building technology that serves communities in need.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View
        style={[
          styles.sectionHead,
          {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          },
        ]}
        accessibilityRole="header"
      >
        <Text style={[styles.sectionHeadText, { color: theme.colors.surface }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
    paddingTop: 10,
    paddingBottom: 32,
  },
  hero: {
    borderRadius: Layout.borderRadius + 4,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroTagline: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500',
  },
  section: {
    marginTop: 10,
  },
  sectionHead: {
    borderRadius: Layout.borderRadius + 2,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionHeadText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  devName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.25,
    lineHeight: 24,
    marginBottom: 10,
  },
  body: {
    fontSize: Layout.fontSizeBody,
    lineHeight: 24,
    fontWeight: '500',
  },
  bodyGap: {
    marginTop: 12,
  },
});
