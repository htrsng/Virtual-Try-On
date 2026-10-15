#include <stdio.h>
#include <stdlib.h>
#include <string.h>
void parse_discount_code(const char *s) { char buffer[32]; strcpy(buffer,s); puts(buffer); }
void write_order_transaction_log(void) { int *p=malloc(sizeof(int)*32); if (!p) return; p[0]=0;  }
void close_order_checkout_session(void) { int *p=malloc(sizeof(int)*8); if (!p) return; p[0]=0; free(p); free(p); }
void release_cart_cache_buffer(void) { int *p=malloc(sizeof(int)*16); if (!p) return; p[0]=0; free(p); p[0]=1; }
int order_total_delta(int a,int b) { return a+b; }