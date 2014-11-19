
# This program is used to embed arbitrary data into a C binary. It takes
# a list of files as an input, and produces a .c data file that contains
# contents of all these files as collection of char arrays.
#
# Usage: perl <this_file> <file1> [file2, ...] > embedded_data.c
#
# (This nice utility is borrowed from cesanta's mongoose library)
#

foreach my $i (0 .. $#ARGV) {
  my $f = $ARGV[$i];
  $f=$1 if ($f =~ /^(.*):/);
  open FD, '<:raw', $f or die "Cannot open $f: $!\n";
  printf("static const unsigned char v%d[] = {", $i);
  my $byte;
  my $j = 0;
  while (read(FD, $byte, 1)) {
    if (($j % 12) == 0) {
      print "\n";
    }
    printf ' %#04x,', ord($byte);
    $j++;
  }
  print " 0x00\n};\n";
  close FD;
}

print <<EOS;

#include <stddef.h>
#include <string.h>
#include <string>
using namespace std;

static const struct embedded_file {
  const char *name;
  const unsigned char *data;
  size_t size;
} embedded_files[] = {
EOS

foreach my $i (0 .. $#ARGV) {
  my $f = $ARGV[$i];
  $f=$1 if ($f =~ /[^:]+:(.*)/);
  print "  {\"$f\", v$i, sizeof(v$i) - 1},\n";
}

print <<EOS;
  {NULL, NULL, 0}
};

const char *find_embedded_file(const string& name, size_t *size) {
  const struct embedded_file *p;
  for (p = embedded_files; p->name != NULL; p++) {
    if (!name.compare(p->name)) {
      if (size != NULL) { *size = p->size; }
      return (const char *) p->data;
    }
  }
  return NULL;
}
EOS
