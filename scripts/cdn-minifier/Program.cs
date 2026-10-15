using NUglify;

if (args.Length < 2)
{
    Console.Error.WriteLine("usage: CdnMinifier <output-dir> <bundle.js>...");
    return 2;
}

var outputDir = args[0];
foreach (var input in args.Skip(1))
{
    if (Path.IsPathRooted(input))
    {
        Console.Error.WriteLine($"bundle paths must be relative so output never overwrites them: {input}");
        return 2;
    }
    var content = File.ReadAllText(input);
    var result = Uglify.Js(content);
    foreach (var error in result.Errors.Where(error => error.IsError))
    {
        Console.Error.WriteLine($"NUglify error in {input}: {error}");
    }
    var minified = result.Code;
    var output = Path.Combine(outputDir, input);
    Directory.CreateDirectory(Path.GetDirectoryName(output)!);
    File.WriteAllText(output, string.IsNullOrWhiteSpace(minified) ? content : minified);
}

return 0;
