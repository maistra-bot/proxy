/* Copyright (C) 2019 by Andrew Selivanov
 *
 * Permission to use, copy, modify, and distribute this
 * software and its documentation for any purpose and without
 * fee is hereby granted, provided that the above copyright
 * notice appear in all copies and that both that copyright
 * notice and this permission notice appear in supporting
 * documentation, and that the name of M.I.T. not be used in
 * advertising or publicity pertaining to distribution of the
 * software without specific, written prior permission.
 * M.I.T. makes no representations about the suitability of
 * this software for any purpose.  It is provided "as is"
 * without express or implied warranty.
 */

#include "ares_setup.h"

#ifdef HAVE_NETINET_IN_H
#  include <netinet/in.h>
#endif
#ifdef HAVE_NETDB_H
#  include <netdb.h>
#endif
#ifdef HAVE_ARPA_INET_H
#  include <arpa/inet.h>
#endif

#include "ares.h"
#include "ares_inet_net_pton.h"
#include "ares_nowarn.h"
#include "ares_private.h"

#define MAX_ALIASES 40

int ares__readaddrinfo(FILE *fp,
                       const char *name,
                       unsigned short port,
                       const struct ares_addrinfo_hints *hints,
                       struct ares_addrinfo *ai)
{
  char *line = NULL, *p, *q;
  char *txtaddr, *txthost, *txtalias;
  char *aliases[MAX_ALIASES];
  unsigned int i, alias_count;
  int status;
  size_t linesize;
  ares_sockaddr addr;
  struct ares_addrinfo_cname *cname = NULL, *cnames = NULL;
  struct ares_addrinfo_node *node = NULL, *nodes = NULL;
  int match_with_alias, match_with_canonical;
  int want_cname = hints->ai_flags & ARES_AI_CANONNAME;

  /* Validate family */
  switch (hints->ai_family) {
    case AF_INET:
    case AF_INET6:
    case AF_UNSPEC:
      break;
    default:
      return ARES_EBADFAMILY;
  }


  while ((status = ares__read_line(fp, &line, &linesize)) == ARES_SUCCESS)
    {
      match_with_alias = 0;
      match_with_canonical = 0;
      alias_count = 0;
      /* Trim line comment. */
      p = line;
      while (*p && (*p != '#'))
        p++;
      *p = '\0';

      /* Trim trailing whitespace. */
      q = p - 1;
      while ((q >= line) && ISSPACE(*q))
        q--;
      *++q = '\0';

      /* Skip leading whitespace. */
      p = line;
      while (*p && ISSPACE(*p))
        p++;
      if (!*p)
        /* Ignore line if empty. */
        continue;

      /* Pointer to start of IPv4 or IPv6 address part. */
      txtaddr = p;

      /* Advance past address part. */
      while (*p && !ISSPACE(*p))
        p++;
      if (!*p)
        /* Ignore line if reached end of line. */
        continue;

      /* Null terminate address part. */
      *p = '\0';

      /* Advance to host name */
      p++;
      while (*p && ISSPACE(*p))
        p++;
      if (!*p)
        /* Ignore line if reached end of line. */
        continue;  /* LCOV_EXCL_LINE: trailing whitespace already stripped */

      /* Pointer to start of host name. */
      txthost = p;

      /* Advance past host name. */
      while (*p && !ISSPACE(*p))
        p++;

      /* Pointer to start of first alias. */
      txtalias = NULL;
      if (*p)
        {
          q = p + 1;
          while (*q && ISSPACE(*q))
            q++;
          if (*q)
            txtalias = q;
        }

      /* Null terminate host name. */
      *p = '\0';

      /* Find out if host name matches with canonical host name. */
      if (strcasecmp(txthost, name) == 0)
        {
          match_with_canonical = 1;
        }

      /* Find out if host name matches with one of the aliases. */
      while (txtalias)
        {
          p = txtalias;
          while (*p && !ISSPACE(*p))
            p++;
          q = p;
          while (*q && ISSPACE(*q))
            q++;
          *p = '\0';
          if (strcasecmp(txtalias, name) == 0)
            {
              match_with_alias = 1;
              if (!want_cname)
                break;
            }
          if (alias_count < MAX_ALIASES)
            {
              aliases[alias_count++] = txtalias;
            }
          txtalias = *q ? q : NULL;
        }

      /* Try next line if host does not match. */
      if (!match_with_alias && !match_with_canonical)
        {
          continue;
        }

      /*
       * Convert address string to network address for the requested families.
       * Actual address family possible values are AF_INET and AF_INET6 only.
       */
      if ((hints->ai_family == AF_INET) || (hints->ai_family == AF_UNSPEC))
        {
          addr.sa4.sin_port = htons(port);
          addr.sa4.sin_addr.s_addr = inet_addr(txtaddr);
          if (addr.sa4.sin_addr.s_addr != INADDR_NONE)
            {
              node = ares__append_addrinfo_node(&nodes);
              if(!node)
                {
                  goto enomem;
                }

              node->ai_family = addr.sa.sa_family = AF_INET;
              node->ai_addrlen = sizeof(sizeof(addr.sa4));
              node->ai_addr = ares_malloc(sizeof(addr.sa4));
              if (!node->ai_addr)
                {
                  goto enomem;
                }
              memcpy(node->ai_addr, &addr.sa4, sizeof(addr.sa4));
            }
        }
      if ((hints->ai_family == AF_INET6) || (hints->ai_family == AF_UNSPEC))
        {
          addr.sa6.sin6_port = htons(port);
          if (ares_inet_pton(AF_INET6, txtaddr, &addr.sa6.sin6_addr) > 0)
            {
              node = ares__append_addrinfo_node(&nodes);
              if (!node)
                {
                  goto enomem;
                }

              node->ai_family = addr.sa.sa_family = AF_INET6;
              node->ai_addrlen = sizeof(sizeof(addr.sa6));
              node->ai_addr = ares_malloc(sizeof(addr.sa6));
              if (!node->ai_addr)
                {
                  goto enomem;
                }
              memcpy(node->ai_addr, &addr.sa6, sizeof(addr.sa6));
            }
        }
      if (!node)
        /* Ignore line if invalid address string for the requested family. */
        continue;

      if (want_cname)
        {
          for (i = 0; i < alias_count; ++i)
            {
              cname = ares__append_addrinfo_cname(&cnames);
              if (!cname)
                {
                  goto enomem;
                }
              cname->alias = ares_strdup(aliases[i]);
              cname->name = ares_strdup(txthost);
            }
          /* No aliases, cname only. */
          if(!alias_count)
            {
              cname = ares__append_addrinfo_cname(&cnames);
              if (!cname)
                {
                  goto enomem;
                }
              cname->name = ares_strdup(txthost);
            }
        }
    }

  /* Last read failed. */
  if (status == ARES_ENOMEM)
    {
      goto enomem;
    }

  /* Free line buffer. */
  ares_free(line);

  ares__addrinfo_cat_cnames(&ai->cnames, cnames);
  ares__addrinfo_cat_nodes(&ai->nodes, nodes);

  return node ? ARES_SUCCESS : ARES_ENOTFOUND;

enomem:
  ares_free(line);
  ares__freeaddrinfo_cnames(cnames);
  ares__freeaddrinfo_nodes(nodes);
  return ARES_ENOMEM;
}
