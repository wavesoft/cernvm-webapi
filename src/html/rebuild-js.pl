#!/usr/bin/perl
use strict;
use warnings;
use Data::Dumper;

# The namespace of the plugin
my $NS = "CVM";
my $VERSION = "2.0.0";

# Accepts one argument: the full path to a directory.
# Returns: A list of files that reside in that path.
sub get_js_list {
    my $path    = shift;

    opendir (DIR, $path)
        or die "Unable to open $path: $!";

    # List files in dir
    my @files =
        map { $path . '/' . $_ }
        grep { !/^\.{1,2}$/ }
        readdir (DIR);
    
    # Start from deeper directories
    my @dirs = grep { -d $_ } @files;
    foreach ( @dirs ) {
        print "Scanning directory: $_\n";
        @files = ( @files, get_js_list ($_) );
    }
    
    # Keep only the javascript files
    return
        grep { (/\.js$/) && (!/Init\.js/) && (! -l $_) }
        @files;
}

# Read file into buffer
sub read_file {
    my $file = shift;
    local $/;
    open(FILE, $file) or die "Can't read '$file' [$!]\n";  
    my $buf = <FILE>; 
    close (FILE);  
    return $buf;
}

# Concat everything
my @files = 
my $buffer = "";
foreach (get_js_list('js.src')) {
    print "Collecting: $_...";
    $buffer .= read_file( $_ );
    print "ok\n";
}

# Last part is the init script
print "Collecting js.src/Init.js...";
$buffer .= read_file( "js.src/Init.js" );
print "ok\n";

# Enclose it into a function and dump it into the final file
open  DUMP_FILE, ">cvmwebapi-$VERSION-src.js";
print DUMP_FILE "window.$NS={'version':'$VERSION'};(function(_NS_) {\n";
print DUMP_FILE $buffer."\n";
print DUMP_FILE "})(window.$NS);\n";
close DUMP_FILE;

# Compress
print "Compressing...";
`yuicompressor -o cvmwebapi-$VERSION.js cvmwebapi-$VERSION-src.js`;
if ($? == 0) {
    print "ok\n";
} else {
    system("cat -n cvmwebapi-$VERSION-src.js");
    print "failed\n";
}

