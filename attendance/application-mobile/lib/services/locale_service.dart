import 'package:flutter/material.dart';

class LocaleService {
  static final ValueNotifier<Locale> locale = ValueNotifier(const Locale('fr'));

  static void setLocale(String lang) {
    locale.value = Locale(lang);
  }
}
