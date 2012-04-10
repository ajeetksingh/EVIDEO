AC_INIT([qt_sbtl_embedder], [0.1])
AC_PREREQ([2.59])
AC_CONFIG_SRCDIR(src/qt_sbtl_embedder.cc)
AC_CHECK_HEADERS([mp4v2/mp4v2.h])
AC_CHECK_LIB([mp4v2], [MP4Create], [], [AC_MSG_ERROR([mp4v2 required!])])
AM_INIT_AUTOMAKE([1.10 -Wall no-define foreign])
AC_CONFIG_HEADERS([config.h])
AC_PROG_CXX
AC_CONFIG_FILES([Makefile])
AC_OUTPUT
