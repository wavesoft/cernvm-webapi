#!/usr/bin/perl
use strict;
use warnings;
use Data::Dumper;
use MIME::Base64;

# The namespace of the plugin
my $NS = "CVM";
my $VERSION = "2.0.13";

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
    my $binary = shift or 0;
    local $/;
    open(FILE, $file) or die "Can't read '$file' [$!]\n";  
    binmode FILE if ($binary);
    my $buf = <FILE>; 
    close (FILE);  
    return $buf;
}

# Build the embedded resources buffer
sub build_resources {
    my $path = shift;
    my $buffer = "";

    # Open directory for reading
    opendir (DIR, $path) or die "Unable to open $path: $!";
    while (my $file = readdir(DIR)) {
        if ($file =~ /^(.*?).([^.]+)$/) {
            my $var = uc($1);
            my $mime = $2;
            if ($mime eq "gif") {
                $mime = "image/gif";
            } elsif ($mime eq "png") {
                $mime = "image/png";
            } elsif ($mime eq "jpg") {
                $mime = "image/jpeg";
            } elsif ($mime eq "jpeg") {
                $mime = "image/jpeg";
            } else {
                $mime = "";
            }

            if ($mime) {
                print "Buffering resource $file...";
                my $payload = read_file("$path/$file");
                if ($payload) {
                    $payload = encode_base64($payload, "");
                    $buffer .= "var $var = \"data:$mime;base64,$payload\";\n";
                    print "ok\n";
                } else {
                    print "empty\n";
                }
            }
        }
    }
    closedir(DIR);

    return $buffer;
}

# Build resources
my $buffer = build_resources("js.src/Resources");

# Concat everything
my @files;
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

# Check if we have yuicompressor in path
if (`which yuicompressor` ne "") {
    # Compress
    print "Compressing...";
    `yuicompressor -o cvmwebapi-$VERSION.js cvmwebapi-$VERSION-src.js`;
    if ($? == 0) {
        print "ok\n";
    } else {
        system("cat -n cvmwebapi-$VERSION-src.js");
        print "failed\n";
    }
} else {
    # Otherwise just rename
    `mv cvmwebapi-$VERSION-src.js cvmwebapi-$VERSION.js`;
}
